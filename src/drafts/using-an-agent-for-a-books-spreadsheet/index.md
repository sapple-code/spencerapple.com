---
title: "Draft outline: An Agent Built the Books Spreadsheet I Would Never Maintain"
author: Spencer Apple
layout: post.pug
publishDate: 2026-07-28 15:00
modifyDate: 2026-07-28 15:00
---

## Working title

- Primary: `An Agent Built the Books Spreadsheet I Would Never Maintain`
- Alternative: `Turning Amazon and Libby Exports Into a Reading History`
- Alternative: `How I Tracked My Reading Without Logging Every Book`

## Editorial spine

- Problem: manual tracking is too tedious to survive.
- Opportunity: digital reading already produces records.
- Method: use an agent to reconcile exports into a human-inspectable sheet.
- Boundary: activity, completion, engagement, and personal judgment are
  different facts.

## Opening: too lazy for a tracking habit

- Personal premise: recommendations and completed books were scattered.
- Manual spreadsheet maintenance repeatedly lost to friction.
- Digital reading made collection possible without logging each session.
- Link to the results post:
  [Reading by Default](/drafts/the-books-ive-read/).
- Thesis placeholder: `[the useful part of the agent is not omniscience; it is
  patient reconciliation plus a reviewable output]`.

## What I wanted the spreadsheet to do

- Keep recommendations and read books in one searchable place.
- Answer:
  - What have I read?
  - What am I reading?
  - What did I stop?
  - Who recommended a book?
  - What should count in personal reading statistics?
- Preserve manual corrections and judgment.
- Remain understandable without the agent.
- Note the current tradeoff:
  - One table contains recommendations, imports, loans, active reading, and
    outcomes.
  - Filters and explicit classification fields are therefore essential.

## Source 1: the Amazon Kindle data download

- Request a personal-data export from Amazon.
- Files actually used by the classifier:
  - `Kindle.Devices.ReadingSession.csv`
  - `Kindle.reading-insights-sessions_with_adjustments.csv`
  - `Kindle.UserUniqueTitlesCompleted.csv`
  - `Kindle.UnifiedLibraryIndex.CustomerTags.1.1.csv`
- What the files contribute:
  - ASIN and title/edition identifiers.
  - Session timestamps.
  - Reading milliseconds.
  - Screen-turn counts.
  - Explicit completion events.
  - Library tags such as `Finished` and `In Progress`.
- Important limits:
  - Screen turns are not printed pages.
  - `In Progress` does not mean abandoned.
  - No reliable percentage-read or furthest-location field was available.
  - Several editions of one title can appear separately.
  - Author, genre, ISBN, and print page count are often absent.
- Scale prompt:
  - 4,122 reading-session rows.
  - 44 explicit completion records.
  - 120 named ASINs joined through Reading Insights.

## Source 2: the Libby history download

- Export the user's Libby timeline/history.
- TODO before prose:
  - Record the exact export menu labels used.
  - Record the exported file name and columns.
  - Confirm whether the export distinguishes ebook from audiobook consistently.
- What the current sheet can safely retain:
  - Loan/borrow evidence.
  - Recommendation/source context.
  - Some format hints in `Recommendation Source`.
- What a Libby loan cannot prove:
  - That the book was opened.
  - That it was finished.
  - Which format was actually consumed when multiple records exist.
- Rule: Libby-only loans default to `Unknown`, not `Completed`.

## The sheet model

- Existing human-facing fields:
  - Author.
  - Book.
  - Fiction / Non Fiction.
  - Theme.
  - Recommendation Source.
  - Page Count.
  - Started Reading.
  - Finished Reading.
  - Read Count.
  - Legacy Status.
  - ISBN-13.
- Classification fields added after reconciliation:
  - Outcome.
  - Engagement.
  - Counts as Read.
  - Evidence.
  - Review Note.
  - Kindle Tag.
  - Kindle ASIN.
- Design prompt: `[why Evidence and Review Note matter as much as the final
  label]`.

## The agent workflow

1. Read the sheet and exports without writing.
2. Inventory file schemas and useful evidence.
3. Normalize titles conservatively:
   - Unicode, punctuation, and whitespace.
   - Edition/format words.
   - Safe subtitle and series comparisons.
4. Match in layers:
   - Normalized exact title.
   - One unique contained-title match.
   - Conservative token similarity with a minimum score and separation from
     the next candidate.
5. Keep ambiguous titles unmatched; never invent an ASIN.
6. Aggregate Kindle activity by ASIN:
   - Page flips.
   - Reading hours.
   - Last activity.
   - Completion event.
   - Finished/in-progress tag.
7. Apply evidence priority and manual overrides.
8. Produce a review CSV before changing the sheet.
9. Resolve the review list with explicit personal decisions.
10. Write classification fields and verify the exact changed ranges.

## Completion is not engagement

- Outcome answers: what happened?
  - `Completed`
  - `Partial`
  - `Stopped`
  - `Reading`
  - `Unknown`
  - `Unknown / Inactive`
- Engagement answers: how much evidence of reading exists?
  - `Deep`
  - `Partial`
  - `Light`
  - `Unknown`
- Counts as Read answers: should this title enter personal reading statistics?
  - `Yes`
  - `No`
  - `Review`
- Key examples:
  - `The Count of Monte Cristo`: deep engagement, deliberately stopped, does
    not count.
  - `Old Mars`: partial collection, counts by manual judgment.
  - `The Montessori Baby`, `Read Write Own`, and `Thirty Million Words`:
    partial, but enough value consumed to count.
- Principle prompt: `[a high activity score can prioritize review; it cannot
  decide completion]`.

## Evidence priority

1. Manual decision.
2. Kindle library tag `Finished`.
3. Amazon completion event.
4. Existing `Status = Completed`.
5. Existing Reading status or activity in the last six months.
6. Older Kindle activity → `Unknown / Inactive`.
7. Libby-only loan → `Unknown`.

- Special case: when several Kindle editions match, a `Finished` edition wins
  over another edition marked `In Progress`.
- Example: `Good Omens`.

## The result

- 95 Completed.
- 4 Partial.
- 6 Stopped.
- 9 Reading.
- 99 count as read.
- 21 do not count.
- 0 remain in Review.
- Counterintuitive audit result:
  - 54 of the 99 read books still have legacy `Status = Abandoned`.
  - Therefore the old status must not drive charts or public claims.

## What still needs judgment or cleanup

- `Livesuit` has an impossible start/finish order.
- `Smart Money` lacks enough identity/metadata context.
- `The Power Broker` is duplicated.
- Four books share one suspicious finish date.
- Page counts are missing for 51 of 99 read books.
- Genre is missing in the sheet for 89 of 99 read books.
- Format actually consumed is not reliably modeled.
- Print ISBN and Kindle “print length” must not be mixed across editions without
  an explicit policy.

## Make the workflow repeatable

- Current implementation:
  - `scripts/classify-kindle-books.mjs`
  - `docs/books-classification-method.md`
  - `docs/books-classification-review.csv`
- Scope boundary:
  - The classifier reads a sheet snapshot plus the Amazon Kindle export.
  - Libby-derived rows already present in the sheet are treated as loan
    evidence.
  - It does not yet parse a raw Libby export directly.
- Prose must distinguish the one-time agent-assisted Libby import from the
  repeatable Kindle classifier.
- Run prompt:

  ```sh
  node scripts/classify-kindle-books.mjs
  ```

- Next CLI-sized improvements:
  - Fetch or export a fresh read-only sheet snapshot.
  - Accept a Libby export path explicitly.
  - Emit a machine-readable audit summary for chart generation.
  - Preserve a small manual-decisions file outside the classifier code.
  - Add tests for title ambiguity, edition precedence, and date conflicts.
- Do not turn the workflow into a generic book-provider abstraction until a
  second concrete import path requires it.

## Close

- Link back to the reading visualizations.
- Summary prompt: `[the agent removed clerical work but made uncertainty more
  visible, not less]`.
- Final boundary: automation proposes and reconciles; the owner decides what
  counts as read.
