# Books spreadsheet audit

Why: the resolved classification supports reading-volume and cadence charts, but
the visuals must disclose that most read dates are proxies, most genres are
editorial labels, and just under half of the read books have page counts.

The current classification rules and runnable implementation are documented in
[`books-classification-method.md`](books-classification-method.md). This audit
retains the earlier investigation and data-quality findings.

Source: [Books](https://docs.google.com/spreadsheets/d/1i9DOvLDRb9pCQimrmda3Y9Djob4wRDmYhT9-fiLIxkk/edit),
live `Sheet1!A1:W293`, re-audited 2026-07-28.

## 2026-07-28 live-sheet visualization audit

The public reading analysis must filter on `Counts as Read = Yes`, not the
legacy `Status` field. The final resolved classification is:

- 95 `Completed`
- 4 `Partial`
- 6 `Stopped`
- 9 `Reading`
- 99 count as read
- 21 do not count as read
- 0 need review

This distinction changes the analysis substantially. Of the 99 books that count
as read, 54 still have the old `Status = Abandoned`, one says `Borrowed`, and
one says `Reading`. Those values reflect the earlier import/recency model, not
the resolved reading outcome.

### Visualization readiness

| Field or derived value | Populated for read books | Use |
| --- | ---: | --- |
| Outcome and Counts as Read | 99 / 99 | Canonical filter and completion/partial distinction |
| Finished Reading | 41 / 99 | Exact completion-date observations |
| Last Activity | 92 / 99 | Date proxy when no finish date exists |
| Started Reading | 96 / 99 | Final fallback date for three otherwise undated rows |
| Chartable read date | 97 / 99 | Year, month, cadence, and gap charts |
| Page Count | 48 / 99 | Genre-length chart with per-bar sample sizes |
| Theme / genre in the sheet | 10 / 99 | Insufficient without local editorial classification |
| Author | 98 / 99 | Labels and author analysis |
| ISBN-13 | 17 / 99 | Insufficient for edition-safe metadata joins |

Use this date hierarchy for the post visuals:

1. `Finished Reading`
2. `Last Activity`, clearly labeled as a proxy
3. `Started Reading`, clearly labeled as a weaker proxy

That yields 41 exact finish dates, 53 last-activity proxies, three start-date
proxies, and two undated books (`The Hard Thing About Hard Things` and
`Good to Great`).

### Rebuilt analysis

The local chart data assigns one broad editorial genre to 98 of the 99 read
books. `Smart Money` remains unclassified because the author and exact work are
unresolved.

| Broad genre | Books | Page counts known | Average known pages |
| --- | ---: | ---: | ---: |
| Science fiction | 40 | 17 | 497 |
| Fantasy | 24 | 16 | 700 |
| Science, history & society | 13 | 7 | 375 |
| Work & technology | 9 | 3 | 275 |
| Health, family & memoir | 8 | 3 | 312 |
| Literary & crime | 4 | 2 | 384 |
| Unclassified | 1 | 0 | — |

Read-date counts from the 97 dateable books are 6 in 2020, 10 in 2021, 16 in
2022, 15 in 2023, 16 in 2024, 29 in 2025, and 5 through June 2026. Science
fiction and fantasy account for 64 of all 99 read books.

Cadence is clustered rather than uniform:

- median gap between chart dates: 16 days
- longest gap: 166 days
- months containing a chart date: 5 in 2020, 5 in 2021, 11 in 2022, 6 in
  2023, 11 in 2024, all 12 in 2025, and 4 through June 2026

These are read-date proxies, not daily reading-session measures. Empty months
mean no recorded finish/activity proxy, not necessarily no reading.

### Missing and suspect data

- `Livesuit` starts on 2025-03-10 but finishes on 2025-03-09.
- Four read books share 2023-12-03 as a finish date, suggesting a reconciliation
  date rather than four independently exact completions.
- `Smart Money` lacks author, genre, page count, and a finish/activity date; its
  start date is the only available chart proxy.
- `The Power Broker` appears twice in the broader sheet with the same ISBN.
- Page-count coverage is uneven by genre and edition, so the average-page chart
  must show `known / total` sample sizes.
- Format actually consumed is not a dedicated field. Recommendation Source
  sometimes mentions Libby or Kindle, but it cannot support a reliable
  Kindle-versus-audiobook comparison.

### Proposed post charts

1. Stacked annual bars by broad genre, using all 97 dateable books that count
   as read and disclosing the date hierarchy.
2. Horizontal average-page bars by genre, showing average and known-page
   sample size over the genre total.
3. A year-by-month cadence heatmap, paired with median and longest-gap metrics.

The generated post data lives in
`src/drafts/the-books-ive-read/data/reading-history.json`; the browser chart
code lives in `client/books-reading-charts.js`.

## 2026-07-27 enrichment pass

The first metadata cleanup made these verified changes:

- Added 100 unambiguous authors.
- Added 70 edition-specific page counts resolved from ISBN-13.
- Corrected `softwarearchitectelevator` to `The Software Architect Elevator`.
- Removed the trailing space from `Refactoring`.
- Resolved four title/author records after direct publisher searches; three
  titles were expanded or corrected: `The Quest for a Universal Theory of
  Life`, `Chokepoints`, and `The Catalyst`. `Abundance` kept its title and
  gained its authors.
- Used the recommendation thread's Jutland context to resolve `Rules of the
  Game` as Andrew Gordon's `The Rules of the Game: Jutland and British Naval
  Command`.
- Marked `The Hard Thing About Hard Things` and `Good to Great` completed because both rows explicitly said `Read whole book`.

Current missing counts across 289 titled rows:

- Author: 2
- ISBN-13: 157
- Page Count: 164

The two unresolved authors need context because title-only search returns
multiple plausible works:

| Row | Title | Plausible authors / issue |
| ---: | --- | --- |
| 121 | Smart Money | Multiple unrelated books; current search results are weak |
| 168 | Manipulation, What It Is, How to Stop It | No reliable catalog match |

ISBNs were not bulk-filled for Kindle rows. A print ISBN identifies a specific
edition, while the imported Kindle page count is an ebook “print length.”
Combining an arbitrary print ISBN with the Kindle count would create
edition-inconsistent records. The next import should retain ASIN/format, or the
sheet should explicitly choose a canonical print-edition policy.

## 2026-07-27 pre-classification chart snapshot

The tables below preserve the earlier `Status = Completed` audit for provenance.
They are superseded by the 2026-07-28 `Counts as Read` analysis above.

### What was chart-ready

| Field | Completed books populated | Use |
| --- | ---: | --- |
| Book | 43 / 43 | Labels and favorites |
| Started Reading | 41 / 43 | Reading intervals |
| Finished Reading | 41 / 43 | Annual and monthly completion charts |
| Page Count | 42 / 43 | Average length by genre |
| Read Count | 43 / 43 | Re-read analysis |
| Status | 43 / 43 | Completed-book filter |
| Recommendation Source | 42 / 43 | Source analysis |

### Missing data found in that snapshot

| Field | Completed books populated | What it blocks |
| --- | ---: | --- |
| Theme | 5 / 43 | Genre slices and average pages by genre |
| Fiction / Non Fiction | 5 / 43 | Basic fiction/nonfiction comparison |
| Author | 43 / 43 | Favorite-author and author-diversity analysis |
| ISBN-13 | 9 / 43 | Reliable metadata enrichment and deduplication |
| Rating / favorite | Not tracked | Favorite-books ranking |
| Format actually consumed | Not tracked | Kindle versus audiobook comparison |
| Libby loan/return/listen dates | Not tracked | Audiobook completions and format-specific cadence |
| Series and series number | Not tracked | Series completion analysis |

Across all 296 populated rows, `Time Duration` is entirely empty and `Date Read` is populated only three times. Both appear redundant with the start/finish fields and should either be defined precisely or removed.

## Data-quality checks

- `Livesuit` finishes on 2025-03-09 but starts on 2025-03-10.
- `All Systems Red` spans 332 days, which may be real but is an outlier worth checking.
- Five books share 2023-12-03 as their finish date. That may reflect an import or reconciliation date rather than the actual completion date.
- Kindle imports frequently omit author, genre, fiction/nonfiction, and ISBN.
- Rows include recommendations, active reading, loans, abandoned books, malformed partial rows, and completed books in one table. The `Status` filter is therefore essential.
- “Abandoned” means no activity for six months, not necessarily a deliberate decision to stop. Use “inactive” in public-facing analysis unless that definition is explained.

## Abandoned versus completed

The current `Abandoned` value is an inactivity heuristic, not a reading outcome.
There are 69 such rows. A safer model separates:

- `Outcome`: Completed, Stopped, In progress, Unknown
- `Evidence`: Amazon completion event, manual confirmation, next series volume, activity only, Libby loan
- `Confidence`: Verified, High, Medium, Low
- `Last Activity`

Reserve `Stopped` for an explicit manual decision. Treat the current
six-month rule as `Inactive / Unknown`.

Strong completion candidates based on immediate series progression:

- Rows 182–183: `Nexus`, `Crux`
- Row 205: `Ship of Destiny`
- Rows 209 and 211: `The Blade Itself`, `Last Argument of Kings`
- Row 223: `Pandora's Star`
- Rows 238, 241, 244, 250, 253, 257, 258, and 261: mainline Expanse novels
- Rows 264–266: Dungeon Crawler Carl books 1–3

Possible but less certain candidates include `Apex`, `Ashes of Man`, the Rifters
books, optional Expanse novellas, and `Children of Ruin`. These should not be
changed without manual confirmation.

### What the Amazon export actually records

The raw export is available at `/Users/spencer.apple/dev/kindle`.

- `Kindle.Devices.ReadingSession.csv` contains 4,122 session rows. Its useful
  fields are ASIN, start/end timestamps, reading milliseconds, and
  `number_of_page_flips`.
- 4,041 sessions have numeric page-flip counts, covering 120 named ASINs after
  joining to Reading Insights.
- `Kindle.UserUniqueTitlesCompleted.csv` contains 44 explicit completion
  records.
- The export does not provide usable per-title percentage read or furthest
  location. The apparent progress fields elsewhere in the export contain
  `Not Included in Search Result` or `Not Available`.

`number_of_page_flips` is a count of screen turns, not printed pages. Font size,
screen size, layout, backtracking, and edition all affect it. Across 36
completed books with known printed page counts, the personal calibration is:

- Median: 2.66 screen turns per printed page
- Middle 50%: 2.27–3.28
- Observed range: 1.68–4.65
- Median reading time: 3.3 hours per 100 printed pages

This is useful as corroborating evidence, but not as a hard completion
threshold. For example, `Pandora's Star` has 4,388 page flips and 36.8 reading
hours despite lacking an Amazon completion event. `Ship of Destiny`, `Last
Argument of Kings`, the later Expanse novels, and the first three Dungeon
Crawler Carl books also have substantial activity consistent with their series
progression.

### Activity score

Use both screen turns and time so fast skimming, backtracking, and idle sessions
do not dominate the inference. The baselines come from 36 Amazon-confirmed
completions with known page counts:

```text
flip_fraction = page_flips / (2.66 * printed_pages)
time_fraction = reading_hours / (0.033 * printed_pages)
activity_score = sqrt(flip_fraction * time_fraction)
```

The geometric mean requires both signals to be substantial. The minimum score
among the 36 calibration completions is 0.77; the 10th percentile is 0.84 and
the median is approximately 1.00.

The score measures engagement, not completion. Two manual counterexamples make
a universal completion threshold invalid:

- `The Count of Monte Cristo` scores 1.22 but was abandoned around 60%.
- `Old Mars` scores 0.76 and counts as read despite only some stories being
  completed, because it is a short-story collection.

Use the score only to describe depth of engagement:

- Below 0.25: opened or lightly sampled.
- 0.25–0.74: partially engaged.
- 0.75 or above: deeply engaged.

When a reliable page count is unavailable, use a conservative raw-activity
fallback:

- `Deep`: at least 800 screen turns and 8 reading hours.
- `Partial`: at least 100 turns and 1 hour, or at least 400 turns, or at least
  4 hours.
- `Light`: activity below those thresholds.

An explicit completion or manual classification overrides the fallback.

Keep outcome separate:

- `Completed`: Amazon completion event or manual confirmation.
- `Counts as Read`: manual judgment, which may depend on book structure.
- `Abandoned`: manual confirmation.
- `In progress`: recent activity.
- `Unknown / Inactive`: no completion event and no recent activity.

Series progression and a high activity score can prioritize rows for review,
but neither should automatically change the outcome.

Examples with exact-edition page counts and manual truth:

| Book | Activity score | Engagement | Outcome |
| --- | ---: | --- | --- |
| `The Count of Monte Cristo` | 1.22 | Deep | Abandoned around 60% |
| `The Married Man Sex Life Primer 2011` | 0.92 | Deep | Unknown |
| `Old Mars` | 0.76 | Deep | Counts as read; partial collection |
| `Slow Productivity` | 0.06 | Light | Unknown / inactive |
| `The Immortal Life of Henrietta Lacks` | ~0.00 | Light | Unknown / inactive |

## Editorial taxonomy used by the draft charts

The draft visualizations add a local broad genre to each completed title:

- Fantasy
- Science fiction
- History & society
- Memoir & parenting
- Literary & crime
- Work & technology

Thirty-eight of the 41 genre labels are inferred locally from title/series knowledge because the sheet does not contain them. They are kept in the post’s local data file rather than written back to the spreadsheet.

## Suggested spreadsheet additions

Add these columns before treating the spreadsheet as a durable reading dataset:

1. `Genre` — one controlled broad category per book.
2. `Subgenre / Theme` — freeform or multi-select detail.
3. `Format` — Kindle ebook, Libby ebook, Libby audiobook, other.
4. `Author` — populated for every title.
5. `Series` and `Series Number`.
6. `Rating` — a small fixed scale, plus `Favorite` as a boolean.
7. `Metadata Source` and `Metadata Checked At`.
8. `Completion Date Confidence` — exact, inferred, or import/reconciliation date.

Keep Amazon/Libby event history in a separate raw-import tab. Build the main `Books` tab as one normalized row per edition or work, with imports updating it through a stable key such as ISBN plus normalized title.
