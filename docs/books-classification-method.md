# Book reading classification

Why: Amazon's old `Status = Abandoned` value was an inactivity heuristic, not
proof that a book was deliberately abandoned. The classification keeps reading
outcome, depth of engagement, and whether a book counts in personal reading
statistics separate.

The implementation is
[`scripts/classify-kindle-books.mjs`](../scripts/classify-kindle-books.mjs).
It reads a Books sheet snapshot plus the Amazon Kindle export and writes
`docs/books-classification-review.csv`. It does not write to Google Sheets.

## Output fields

| Field | Meaning |
| --- | --- |
| `Outcome` | `Completed`, `Partial`, `Stopped`, `Reading`, `Unknown`, or `Unknown / Inactive` |
| `Engagement` | `Deep`, `Partial`, `Light`, or `Unknown` |
| `Counts as Read` | Personal decision: `Yes`, `No`, or `Review` |
| `Evidence` | Strongest evidence used for the outcome |
| `Review Note` | Manual context or an unresolved edge case |
| `Kindle Tag` | Amazon library progress tag: `Finished` or `In Progress` |
| `Kindle ASIN` | Kindle edition identifier |

## Evidence priority

The first matching rule wins:

1. Manual decisions in the script.
2. Kindle library tag `Finished`.
3. Amazon `UserUniqueTitlesCompleted` event.
4. Existing spreadsheet `Status = Completed`.
5. Existing `Reading` status or activity within the last six months.
6. Older Kindle activity becomes `Unknown / Inactive`.
7. Libby-only loans become `Unknown`.

`In Progress` does not mean abandoned. It only says Kindle did not mark that
edition finished. Recency and manual review determine whether it is currently
being read, partially read, or deliberately stopped.

When several Kindle editions match one spreadsheet title, `Finished` wins for
the "ever completed" decision. This handles `Good Omens`, where one edition is
finished and another is in progress.

## Engagement

Completion always implies `Deep`. Otherwise, when no reliable printed-page
comparison is available:

- `Deep`: at least 800 screen turns **and** 8 reading hours.
- `Partial`: at least 100 turns and 1 hour, or 400 turns, or 4 hours.
- `Light`: activity below those thresholds.
- `Unknown`: no usable activity.

Page flips are screen turns, not printed pages. They measure engagement and
must never be used alone to infer completion.

## Counts as read

This is deliberately a personal judgment rather than an Amazon-derived field:

- Confirmed completions count.
- A partial book can count when enough of its value was consumed, such as
  `Old Mars`, `The Montessori Baby`, `Read Write Own`, and
  `Thirty Million Words`.
- A deliberately stopped book does not count, even after deep engagement, such
  as `The Count of Monte Cristo`.
- Manual decisions override every automated signal.

## Title matching

Kindle records are joined to spreadsheet rows in this order:

1. normalized exact title;
2. one unique contained-title match;
3. a conservative token-similarity match with a minimum score and separation
   from the next candidate.

Ambiguous titles remain unmatched. The script never invents an ASIN.

## Run

```sh
node scripts/classify-kindle-books.mjs
```

Optional arguments:

```text
--kindle-dir PATH
--snapshot PATH
--output PATH
```

The default inputs are `/Users/spencer.apple/dev/kindle` and
`/Users/spencer.apple/dev/books-sheet-audit/mcp/verification_snapshot.json`.

Current verified result:

- 95 completed
- 4 partial
- 6 stopped
- 9 reading
- 99 count as read
- 21 do not count
- 0 awaiting review
