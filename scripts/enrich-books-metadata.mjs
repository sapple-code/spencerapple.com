#!/usr/bin/env node

/**
 * Read-only book metadata matcher.
 *
 * Input: JSON array on stdin with objects shaped like:
 *   { row, title, author, isbn, pages, source, status }
 *
 * Output: one JSON object per line. The script never writes to Google Sheets.
 * It queries Open Library and Google Books, preserving edition-level ambiguity
 * rather than silently mixing an ebook title with a print edition's ISBN/pages.
 */

import process from "node:process";

const input = await new Promise((resolve, reject) => {
  let body = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => (body += chunk));
  process.stdin.on("end", () => resolve(body));
  process.stdin.on("error", reject);
});

const rows = JSON.parse(input);

const normalize = (value = "") =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(a|an|the|novel|book|edition|revised|updated|volume|vol)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokens = (value) => new Set(normalize(value).split(/\s+/).filter(Boolean));

function similarity(a, b) {
  const aa = tokens(a);
  const bb = tokens(b);
  if (!aa.size || !bb.size) return 0;
  const intersection = [...aa].filter((token) => bb.has(token)).length;
  return (2 * intersection) / (aa.size + bb.size);
}

function validIsbn13(value = "") {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 13) return false;
  const sum = [...digits].reduce(
    (total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1),
    0,
  );
  return sum % 10 === 0;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, {
      headers: { "User-Agent": "spencerapple-books-audit/1.0" },
    });
    if (response.ok) return response.json();
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts) {
      throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }
    await delay(400 * attempt);
  }
}

function googleCandidates(data, row) {
  return (data.items ?? []).map(({ volumeInfo = {}, id }) => {
    const identifiers = Object.fromEntries(
      (volumeInfo.industryIdentifiers ?? []).map((item) => [
        item.type,
        item.identifier,
      ]),
    );
    const authors = volumeInfo.authors ?? [];
    const titleScore = similarity(row.title, volumeInfo.title);
    const authorScore = row.author
      ? Math.max(0, ...authors.map((author) => similarity(row.author, author)))
      : 0;
    const isbn13 = identifiers.ISBN_13 ?? "";
    return {
      provider: "Google Books",
      provider_id: id,
      title: volumeInfo.title ?? "",
      subtitle: volumeInfo.subtitle ?? "",
      authors,
      isbn13: validIsbn13(isbn13) ? isbn13 : "",
      pages: volumeInfo.pageCount ?? null,
      format: volumeInfo.printType ?? "",
      published: volumeInfo.publishedDate ?? "",
      score: titleScore + authorScore * 0.35,
    };
  });
}

function openLibraryCandidates(data, row) {
  return (data.docs ?? []).map((doc) => {
    const authors = doc.author_name ?? [];
    const titleScore = similarity(row.title, doc.title);
    const authorScore = row.author
      ? Math.max(0, ...authors.map((author) => similarity(row.author, author)))
      : 0;
    const isbn13 = (doc.isbn ?? []).find(validIsbn13) ?? "";
    return {
      provider: "Open Library",
      provider_id: doc.key ?? "",
      title: doc.title ?? "",
      subtitle: doc.subtitle ?? "",
      authors,
      isbn13,
      pages: doc.number_of_pages_median ?? null,
      format: "",
      published: doc.first_publish_year ?? "",
      score: titleScore + authorScore * 0.35,
    };
  });
}

function openLibraryIsbnCandidates(data, row) {
  const isbn = row.isbn.replace(/\D/g, "");
  const book = data[`ISBN:${isbn}`];
  if (!book) return [];
  const isbn13 = (book.identifiers?.isbn_13 ?? []).find(validIsbn13) ?? "";
  const authors = (book.authors ?? []).map((author) => author.name).filter(Boolean);
  return [
    {
      provider: "Open Library ISBN",
      provider_id: (book.identifiers?.openlibrary ?? [])[0] ?? "",
      title: book.title ?? "",
      subtitle: book.subtitle ?? "",
      authors,
      isbn13,
      pages: book.number_of_pages ?? null,
      format: "",
      published: book.publish_date ?? "",
      score:
        similarity(row.title, book.title) +
        (row.author
          ? Math.max(0, ...authors.map((author) => similarity(row.author, author))) *
            0.35
          : 0),
    },
  ];
}

function collapse(candidates) {
  const seen = new Set();
  return candidates
    .filter((candidate) => candidate.title && candidate.score >= 0.58)
    .sort((a, b) => b.score - a.score)
    .filter((candidate) => {
      const key = `${normalize(candidate.title)}|${candidate.authors
        .map(normalize)
        .sort()
        .join(";")}|${candidate.isbn13}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

async function enrich(row) {
  const searchTitle = row.title
    .replace(/\([^)]*\)/g, " ")
    .split(/\s+[:–—]\s+/)[0]
    .replace(/\s+/g, " ")
    .trim();
  const queryParts = row.isbn
    ? [`isbn:${row.isbn.replace(/\D/g, "")}`]
    : [`intitle:"${searchTitle}"`];
  if (!row.isbn && row.author) queryParts.push(`inauthor:"${row.author}"`);
  const googleUrl = new URL("https://www.googleapis.com/books/v1/volumes");
  googleUrl.searchParams.set("q", queryParts.join(" "));
  googleUrl.searchParams.set("maxResults", "10");

  const openUrl = new URL(
    row.isbn
      ? "https://openlibrary.org/api/books"
      : "https://openlibrary.org/search.json",
  );
  if (row.isbn) {
    openUrl.searchParams.set("bibkeys", `ISBN:${row.isbn.replace(/\D/g, "")}`);
    openUrl.searchParams.set("jscmd", "data");
    openUrl.searchParams.set("format", "json");
  } else {
    openUrl.searchParams.set("title", searchTitle);
    if (row.author) openUrl.searchParams.set("author", row.author);
  }
  if (!row.isbn) {
    openUrl.searchParams.set(
      "fields",
      "key,title,subtitle,author_name,isbn,number_of_pages_median,first_publish_year",
    );
    openUrl.searchParams.set("limit", "10");
  }

  const [googleResult, openResult] = await Promise.allSettled([
    getJson(googleUrl),
    getJson(openUrl),
  ]);

  const candidates = collapse([
    ...(googleResult.status === "fulfilled"
      ? googleCandidates(googleResult.value, row)
      : []),
    ...(openResult.status === "fulfilled"
      ? row.isbn
        ? openLibraryIsbnCandidates(openResult.value, row)
        : openLibraryCandidates(openResult.value, row)
      : []),
  ]);
  const editionCandidates = row.isbn
    ? candidates.filter(
        (candidate) =>
          candidate.isbn13.replace(/\D/g, "") === row.isbn.replace(/\D/g, ""),
      )
    : candidates;

  const best = editionCandidates[0] ?? null;
  const runnerUp = editionCandidates[1] ?? null;
  const margin = best ? best.score - (runnerUp?.score ?? 0) : 0;
  const authorSets = [
    ...new Set(
      editionCandidates.flatMap((candidate) => candidate.authors.join("; ")),
    ),
  ].filter(Boolean);

  return {
    ...row,
    proposed_title: best?.title ?? "",
    author_candidates: authorSets.slice(0, 4),
    proposed_isbn13: best?.isbn13 ?? "",
    proposed_pages: best?.pages ?? null,
    confidence:
      best &&
      best.score >= 0.96 &&
      (margin >= 0.12 || editionCandidates.length === 1)
        ? row.isbn && best.pages == null
          ? "review"
          : "high"
        : best && best.score >= 0.78
          ? "review"
          : "low",
    candidates: editionCandidates,
  };
}

const concurrency = 4;
let index = 0;

async function worker() {
  while (index < rows.length) {
    const current = rows[index];
    index += 1;
    try {
      const enriched = await enrich(current);
      const output = process.argv.includes("--compact")
        ? {
            row: enriched.row,
            title: enriched.title,
            proposed_title: enriched.proposed_title,
            author_candidates: enriched.author_candidates,
            proposed_isbn13: enriched.proposed_isbn13,
            proposed_pages: enriched.proposed_pages,
            confidence: enriched.confidence,
          }
        : enriched;
      process.stdout.write(`${JSON.stringify(output)}\n`);
    } catch (error) {
      process.stdout.write(
        `${JSON.stringify({ ...current, confidence: "error", error: error.message })}\n`,
      );
    }
    await delay(120);
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
