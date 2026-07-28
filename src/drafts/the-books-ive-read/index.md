---
title: "Draft outline: Reading by Default"
author: Spencer Apple
layout: post.pug
publishDate: 2026-07-28 15:00
modifyDate: 2026-07-28 15:00
---

<link rel="stylesheet" href="css/main.css">
<script defer src="src/charts.js"></script>

## Working title

- Primary: `Reading by Default: The Books I've Read and How I Read`
- Alternative: `What Six Years of Kindle Reading Looks Like`
- Alternative: `Bedtime, Libby, and a Lot of Science Fiction`

## Editorial spine

- Personal story: a low-friction bedtime habit became a substantial reading
  history.
- Data story: digital exhaust makes the pattern visible, but the record is
  incomplete and needs an honest definition of “read.”
- Reader takeaway: reading consistency can look clustered and still be durable.

## Opening: the reading system I did not design

- Scene prompt: Kindle at bedtime; reading as the last dependable part of the
  day.
- Kindle-only for most of the period; some audiobooks more recently.
- Earlier behavior: buy every ebook.
- Current behavior: borrow through Libby when possible.
- Contrast prompt: the habit is deliberate; the tracking mostly was not.
- Thesis placeholder: `[one sentence connecting low-friction access, bedtime,
  and the accumulated reading history]`.

## What counts as read

- Link to the methods post:
  [Using an agent to build my books spreadsheet](/drafts/using-an-agent-for-a-books-spreadsheet/).
- Canonical filter: `Counts as Read = Yes`.
- Result: 99 books.
  - 95 completed.
  - 4 partial books that still count by explicit personal judgment.
- Explicit exclusions:
  - 6 deliberately stopped.
  - 9 currently reading.
  - 6 inactive/unknown titles with too little certainty to count.
- Do not use the old `Status = Abandoned` value:
  - It was an inactivity heuristic.
  - 54 of the 99 read books still carry that legacy value.
- Short caveat prompt: `[why “read” is a personal editorial decision rather
  than a perfect Amazon-derived fact]`.

## What the reading history shows

### Books read by year and genre

<div id="books-by-year" class="reading-chart"></div>

- Chart definition:
  - 97 of 99 read books have a usable date.
  - Date hierarchy: `Finished Reading` → `Last Activity` → `Started Reading`.
  - 41 exact finish dates; 56 labeled proxies; 2 undated books omitted.
  - Broad genre is a local editorial label, not a Google Books category.
- Observation prompts:
  - 2025 is the peak at 29 dated books; 2026 is partial through June.
  - 2022 and 2024 each show 16; 2023 shows 15.
  - Science fiction (40) and fantasy (24) are 64 of the full 99-book set.
  - Series produce visible runs: Robin Hobb, the Expanse, Sun Eater, and Dungeon
    Crawler Carl.
- Interpretation prompt: `[how series reading makes choosing the next bedtime
  book nearly frictionless]`.

### Average page count by genre

<div id="average-pages-by-genre" class="reading-chart"></div>

- Chart definition:
  - 48 of 99 books have page counts.
  - Each bar must show `known page counts / genre total`.
  - Do not compare genres as though coverage were complete or random.
- Observation prompts:
  - Known fantasy books average about 700 pages (`16/24`).
  - Known science-fiction books average about 497 pages (`17/40`).
  - The fantasy result is driven by long series and several 700–1,000-page
    volumes.
- Interpretation prompt: `[book count understates the time represented by long
  fantasy volumes]`.

### Consistency, clusters, and gaps

<div id="completion-cadence" class="reading-chart"></div>

- Chart definition:
  - Year × month heatmap of the same 97 dateable books.
  - Measures recorded finish/activity cadence, not daily reading.
- Observation prompts:
  - Median gap between chart dates: 16 days.
  - Longest gap: 166 days.
  - 2025 has at least one chart date in every month.
  - 2022 and 2024 each have dates in 11 months.
  - Empty months do not prove no reading occurred.
- Interpretation prompt: `[consistency is a returning habit, not an unbroken
  streak]`.

## How my choices changed

- Buying every Kindle book:
  - Convenience.
  - Cost accumulation.
  - Weak pressure to finish because ownership is permanent.
- Borrowing through Libby:
  - Lower cost.
  - Waiting and loan windows affect sequencing.
  - Audiobooks enter the mix.
- Keep the format claim narrow:
  - The sheet does not reliably track the format actually consumed.
  - Recommendation Source mentions Kindle/Libby inconsistently.
- Reflection prompt: `[whether borrowing changed experimentation, stopping, or
  reading speed]`.

## Favorite books

- User input required: choose 3–5 favorites from the classified list.
- For each favorite, collect:
  - Title.
  - Favorite overall or favorite in a category/series.
  - One-sentence reason.
  - What remained afterward: world, idea, character, mood, or reading
    experience.
- Possible structure:
  - Favorite series.
  - Favorite standalone novel.
  - Favorite nonfiction book.
  - Biggest surprise.
- Do not infer favorites from reading time, page flips, series progression, or
  re-reads.

## Close

- Return to the bedtime scene.
- Summary prompt: `[the system works because it asks almost nothing at the
  moment of choice]`.
- Link to the collection/method post.
- Optional final question: `[has seeing the pattern changed what I want to read
  next?]`.
