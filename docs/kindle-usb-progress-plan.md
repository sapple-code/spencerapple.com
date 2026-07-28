# Kindle USB progress inspection plan

Why: Amazon's data export includes reading time and screen turns, but not the
last page or percentage read. The Kindle itself may retain that state in book
sidecar files.

## Read-only procedure

1. Connect the Kindle by USB, wake it, and select file-transfer mode.
2. Confirm whether macOS exposes it as:
   - a mounted drive for pre-2024 Kindles, or
   - an MTP device through Amazon's USB File Manager for Scribe/2024+ models.
3. Inventory filenames, timestamps, and sizes without changing the device.
4. Copy only relevant metadata into a temporary local snapshot:
   - `documents/*.sdr/`
   - `.mbp`, `.mbp1`, `.mbs`, `.azw3r`, `.kfx`, and similarly named sidecars
   - annotation or bookmark databases, if exposed
5. Test a few known books:
   - one currently in progress
   - one Amazon marks completed
   - one likely completed but missing a completion event
6. Look for ASIN, current location, furthest-read location, book length, and
   percentage fields. Compare extracted values with the Kindle's visible UI.
7. If the format is usable, write a read-only extractor that outputs ASIN,
   observed location, percentage, source file, and timestamp.

## Safety and stop conditions

- Do not rename, delete, or edit anything on the Kindle.
- Do not copy book content unless required to interpret its location scale.
- Stop if macOS exposes only the public `Documents` view and no sidecars.
- Do not jailbreak or enable SSH as part of this investigation.
- Treat undocumented binary fields as unverified until checked against the
  Kindle UI.

## Expected outcome

Best case: an exact last-read percentage for many books. Partial success:
bookmark or annotation locations that provide lower bounds. If neither is
available, retain the export-based activity score described in the books data
audit.
