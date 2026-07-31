#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { csvFormat, csvParse } from "d3-dsv";

const DEFAULT_KINDLE_DIR = "/Users/spencer.apple/dev/kindle";
const DEFAULT_SNAPSHOT =
  "/Users/spencer.apple/dev/books-sheet-audit/mcp/verification_snapshot.json";
const DEFAULT_OUTPUT = "docs/books-classification-review.csv";

function usage() {
  return `Usage: node scripts/classify-kindle-books.mjs [options]

Build a read-only review CSV that separates reading outcome, engagement, and
whether a title counts in reading statistics.

Options:
  --kindle-dir PATH   Amazon export directory (default: ${DEFAULT_KINDLE_DIR})
  --snapshot PATH     Books sheet snapshot JSON (default: ${DEFAULT_SNAPSHOT})
  --output PATH       Review CSV path (default: ${DEFAULT_OUTPUT})
  --help              Show this help
`;
}

function parseArgs(argv) {
  const result = {
    kindleDir: DEFAULT_KINDLE_DIR,
    snapshot: DEFAULT_SNAPSHOT,
    output: DEFAULT_OUTPUT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help") {
      process.stdout.write(usage());
      process.exit(0);
    }
    const key = {
      "--kindle-dir": "kindleDir",
      "--snapshot": "snapshot",
      "--output": "output",
    }[value];
    if (!key || !argv[index + 1]) throw new Error(`Unknown/incomplete option: ${value}`);
    result[key] = argv[index + 1];
    index += 1;
  }
  return result;
}

const normalize = (value = "") =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/&/g, " and ")
    .replace(/\b(?:kindle edition|ebook|audiobook|unabridged)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function similarity(left, right) {
  const a = new Set(normalize(left).split(/\s+/).filter(Boolean));
  const b = new Set(normalize(right).split(/\s+/).filter(Boolean));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return (2 * intersection) / (a.size + b.size);
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function readCsv(file) {
  return csvParse((await fs.readFile(file, "utf8")).replace(/^\uFEFF/, ""));
}

function rowObjects(values) {
  const [headers, ...rows] = values;
  return rows.map((row, index) => ({
    sheetRow: index + 2,
    ...Object.fromEntries(headers.map((header, column) => [header, row[column] ?? ""])),
  }));
}

function classifyEngagement(activity, outcome) {
  if (outcome === "Completed") return "Deep";
  if (!activity || (!activity.flips && !activity.hours)) return "Unknown";
  if (activity.flips >= 800 && activity.hours >= 8) return "Deep";
  if (
    (activity.flips >= 100 && activity.hours >= 1) ||
    activity.flips >= 400 ||
    activity.hours >= 4
  ) {
    return "Partial";
  }
  return "Light";
}

function bestActivityMatch(title, activities) {
  const exact = activities.filter((activity) => normalize(activity.title) === normalize(title));
  if (exact.length) return exact.sort((a, b) => b.hours - a.hours)[0];

  const candidates = activities
    .map((activity) => ({ activity, score: similarity(title, activity.title) }))
    .sort((a, b) => b.score - a.score);
  if (
    candidates[0]?.score >= 0.86 &&
    candidates[0].score - (candidates[1]?.score ?? 0) >= 0.08
  ) {
    return candidates[0].activity;
  }
  return null;
}

function bestBookMatch(title, books) {
  const exact = books.filter(
    (book) => book.Book && normalize(book.Book) === normalize(title),
  );
  if (exact.length === 1) return exact[0];

  const normalizedTitle = normalize(title);
  const contained = books.filter((book) => {
    const normalizedBook = normalize(book.Book);
    if (!normalizedBook) return false;
    const [shorter, longer] =
      normalizedBook.length < normalizedTitle.length
        ? [normalizedBook, normalizedTitle]
        : [normalizedTitle, normalizedBook];
    return shorter.length >= 8 && longer.includes(shorter);
  });
  if (contained.length === 1) return contained[0];

  const candidates = books
    .filter((book) => book.Book)
    .map((book) => ({ book, score: similarity(title, book.Book) }))
    .sort((a, b) => b.score - a.score);
  if (
    candidates[0]?.score >= 0.52 &&
    candidates[0].score - (candidates[1]?.score ?? 0) >= 0.15
  ) {
    return candidates[0].book;
  }
  return null;
}

const args = parseArgs(process.argv.slice(2));
const kindlePath = (...parts) => path.join(args.kindleDir, ...parts);

const [snapshot, rawSessions, insightSessions, completionRows, tagRows] =
  await Promise.all([
  fs.readFile(args.snapshot, "utf8").then(JSON.parse),
  readCsv(
    kindlePath("Kindle.Devices.ReadingSession", "Kindle.Devices.ReadingSession.csv"),
  ),
  readCsv(
    kindlePath(
      "Kindle.ReadingInsights",
      "datasets",
      "Kindle.reading-insights-sessions_with_adjustments",
      "Kindle.reading-insights-sessions_with_adjustments.csv",
    ),
  ),
  readCsv(
    kindlePath(
      "Kindle.ReadingInsights",
      "datasets",
      "Kindle.UserUniqueTitlesCompleted",
      "Kindle.UserUniqueTitlesCompleted.csv",
    ),
  ),
  readCsv(
    kindlePath(
      "Kindle.UnifiedLibraryIndex",
      "datasets",
      "Kindle.UnifiedLibraryIndex.CustomerTags.1.1",
      "Kindle.UnifiedLibraryIndex.CustomerTags.1.1.csv",
    ),
  ),
  ]);

const activitiesByAsin = new Map();
for (const row of insightSessions) {
  if (!row.ASIN || row.ASIN === "Not Available") continue;
  const activity = activitiesByAsin.get(row.ASIN) ?? {
    asin: row.ASIN,
    title: row.product_name,
    flips: 0,
    hours: 0,
    sessions: 0,
    lastActivity: "",
  };
  activity.title = row.product_name || activity.title;
  activity.hours += number(row.total_reading_milliseconds) / 3_600_000;
  activity.sessions += 1;
  if (row.end_time > activity.lastActivity) activity.lastActivity = row.end_time;
  activitiesByAsin.set(row.ASIN, activity);
}
for (const row of rawSessions) {
  const activity = activitiesByAsin.get(row.ASIN);
  if (activity) activity.flips += number(row.number_of_page_flips);
}

const completedAsins = new Set(
  completionRows.map((row) => row.asin_date_and_content_type.split("_", 1)[0]),
);
const activities = [...activitiesByAsin.values()];
const books = rowObjects(snapshot.values);
const kindleTags = tagRows
  .filter(
    (row) =>
      row.ASIN &&
      row.ASIN !== "Not Available" &&
      ["Finished", "In Progress"].includes(row["Tag Name"]),
  )
  .map((row) => ({
    asin: row.ASIN,
    title: row["Product Name"],
    tag: row["Tag Name"],
  }));
const tagBySheetRow = new Map();
for (const tag of kindleTags) {
  const book = bestBookMatch(tag.title, books);
  if (!book) continue;
  const existing = tagBySheetRow.get(book.sheetRow);
  if (!existing || (existing.tag !== "Finished" && tag.tag === "Finished")) {
    tagBySheetRow.set(book.sheetRow, tag);
  }
}
const today = new Date("2026-07-28T00:00:00-07:00");
const recentCutoff = new Date(today);
recentCutoff.setMonth(recentCutoff.getMonth() - 6);

const manual = new Map([
  [
    normalize("The Count of Monte Cristo"),
    {
      outcome: "Stopped",
      engagement: "Deep",
      counts: "No",
      evidence: "Manual confirmation",
      note: "Stopped around 60% after substantial engagement.",
    },
  ],
  [
    normalize("Old Mars"),
    {
      outcome: "Partial",
      engagement: "Deep",
      counts: "Yes",
      evidence: "Manual confirmation",
      note: "Read some stories; counts as read because it is a collection.",
    },
  ],
  [
    normalize("The Hard Thing About Hard Things"),
    {
      outcome: "Completed",
      engagement: "Deep",
      counts: "Yes",
      evidence: "Manual note: Read whole book",
      note: "",
    },
  ],
  [
    normalize("Good to Great"),
    {
      outcome: "Completed",
      engagement: "Deep",
      counts: "Yes",
      evidence: "Manual note: Read whole book",
      note: "",
    },
  ],
  [
    normalize("The Color of Law: A Forgotten History of How Our Government Segregated America"),
    {
      outcome: "Completed",
      engagement: "Deep",
      counts: "Yes",
      evidence: "Manual confirmation",
      note: "",
    },
  ],
  [
    normalize("The Culture Map: Breaking Through the Invisible Boundaries of Global Business"),
    {
      outcome: "Stopped",
      engagement: "Partial",
      counts: "No",
      evidence: "Manual confirmation",
      note: "Abandoned.",
    },
  ],
  [
    normalize("Finite and Infinite Games"),
    {
      outcome: "Stopped",
      engagement: "Partial",
      counts: "No",
      evidence: "Manual confirmation",
      note: "Abandoned.",
    },
  ],
  [
    normalize("The Cycle of Arawn: The Complete Trilogy"),
    {
      outcome: "Stopped",
      engagement: "Deep",
      counts: "No",
      evidence: "Manual confirmation",
      note: "Abandoned; does not remember the book.",
    },
  ],
  [
    normalize("The Montessori Baby: A Parent's Guide to Nurturing Your Baby with Love, Respect, and Understanding (The Parents' Guide to Montessori Book 2)"),
    {
      outcome: "Partial",
      engagement: "Partial",
      counts: "Yes",
      evidence: "Manual confirmation",
      note: "Skimmed; learned enough to count it as read.",
    },
  ],
  [
    normalize("Read Write Own: Building the Next Era of the Internet"),
    {
      outcome: "Partial",
      engagement: "Partial",
      counts: "Yes",
      evidence: "Manual confirmation",
      note: "Read roughly one-third to one-half; got enough of the gist.",
    },
  ],
  [
    normalize("Thirty Million Words: Building a Child's Brain"),
    {
      outcome: "Partial",
      engagement: "Partial",
      counts: "Yes",
      evidence: "Manual confirmation",
      note: "Did not finish; got enough of the gist and really liked it.",
    },
  ],
  [
    normalize("Thinking in Bets: Making Smarter Decisions When You Don't Have All the Facts"),
    {
      outcome: "Stopped",
      engagement: "Partial",
      counts: "No",
      evidence: "Manual confirmation",
      note: "Abandoned.",
    },
  ],
  [
    normalize("Making Sense of Chaos: A Better Economics for a Better World"),
    {
      outcome: "Stopped",
      engagement: "Partial",
      counts: "No",
      evidence: "Manual confirmation",
      note: "Read about half and liked it, but abandoned it.",
    },
  ],
  [
    normalize("Abundance"),
    {
      outcome: "Completed",
      engagement: "Deep",
      counts: "Yes",
      evidence: "Manual confirmation",
      note: "Completed; also listened to the audiobook.",
    },
  ],
]);

const reviewRows = books.map((book) => {
  if (!book.Book?.trim()) {
    return {
      "Sheet Row": book.sheetRow,
      Book: "",
      Outcome: "",
      Engagement: "",
      "Counts as Read": "",
      "Page Flips": "",
      "Reading Hours": "",
      "Last Activity": "",
      Evidence: "",
      "Review Note": "",
      "Kindle Tag": "",
      "Kindle ASIN": "",
    };
  }

  const activity = bestActivityMatch(book.Book, activities);
  const kindleTag = tagBySheetRow.get(book.sheetRow);
  const completionEvent = activity && completedAsins.has(activity.asin);
  const manualValue = manual.get(normalize(book.Book));
  const lastActivity = activity?.lastActivity ? new Date(activity.lastActivity) : null;
  const recent = lastActivity && lastActivity >= recentCutoff;

  let outcome = "";
  let evidence = "";
  let note = "";
  if (manualValue) {
    ({ outcome, evidence, note } = manualValue);
  } else if (kindleTag?.tag === "Finished") {
    outcome = "Completed";
    evidence = "Kindle library tag: Finished";
  } else if (completionEvent) {
    outcome = "Completed";
    evidence = "Amazon completion event";
  } else if (book.Status === "Completed") {
    outcome = "Completed";
    evidence = "Existing completed status";
  } else if (book.Status === "Reading" || recent) {
    outcome = "Reading";
    evidence = activity ? "Recent Kindle activity" : "Existing reading status";
  } else if (activity) {
    outcome = "Unknown / Inactive";
    evidence = "Kindle activity; no completion event";
  } else if (book.Status === "Borrowed") {
    outcome = "Unknown";
    evidence = "Libby loan only";
  } else if (book.Status === "Abandoned") {
    outcome = "Unknown / Inactive";
    evidence = "Existing inactivity status only";
  }

  const engagement =
    manualValue?.engagement ?? classifyEngagement(activity, outcome);
  let counts = manualValue?.counts ?? "";
  if (!counts && outcome === "Completed") counts = "Yes";
  if (!counts && (outcome === "Reading" || engagement === "Light")) counts = "No";
  if (
    !counts &&
    outcome.startsWith("Unknown") &&
    ["Partial", "Deep"].includes(engagement)
  ) {
    counts = "Review";
  }
  if (
    !note &&
    outcome.startsWith("Unknown") &&
    engagement === "Deep"
  ) {
    note = "Deep engagement without an Amazon completion event.";
  }

  return {
    "Sheet Row": book.sheetRow,
    Book: book.Book,
    Outcome: outcome,
    Engagement: engagement === "Unknown" && !outcome ? "" : engagement,
    "Counts as Read": counts,
    "Page Flips": activity ? Math.round(activity.flips) : "",
    "Reading Hours": activity ? Number(activity.hours.toFixed(1)) : "",
    "Last Activity": activity?.lastActivity.slice(0, 10) ?? "",
    Evidence: evidence,
    "Review Note": note,
    "Kindle Tag": kindleTag?.tag ?? "",
    "Kindle ASIN": kindleTag?.asin ?? activity?.asin ?? "",
  };
});

await fs.mkdir(path.dirname(args.output), { recursive: true });
await fs.writeFile(args.output, `${csvFormat(reviewRows)}\n`);

const populated = reviewRows.filter((row) => row.Book);
const summarize = (field) =>
  Object.fromEntries(
    [...new Set(populated.map((row) => row[field]).filter(Boolean))]
      .sort()
      .map((value) => [
        value,
        populated.filter((row) => row[field] === value).length,
      ]),
  );

process.stdout.write(
  `${JSON.stringify(
    {
      output: path.resolve(args.output),
      rows: populated.length,
      matchedKindleTitles: populated.filter((row) => row["Page Flips"] !== "").length,
      outcome: summarize("Outcome"),
      engagement: summarize("Engagement"),
      countsAsRead: summarize("Counts as Read"),
      kindleTag: summarize("Kindle Tag"),
    },
    null,
    2,
  )}\n`,
);
