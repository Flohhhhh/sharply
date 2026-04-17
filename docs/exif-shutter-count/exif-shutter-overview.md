# EXIF Shutter Count Overview

This document describes the current data model and extraction behavior for the shutter-count parser behind `/exif-viewer/parse`.

The focus here is the metadata itself:

- which file types are accepted
- how raw ExifTool output is normalized
- how camera brand is inferred
- which shutter-related tags are checked
- which parsed fields are returned
- where the current data gaps still are

## Parser Source

Metadata is now extracted locally in the browser with ExifTool/WASM, then sent to `/exif-viewer/parse` as normalized JSON metadata instead of as an uploaded image file.

This still matters because shutter-count values often live in maker notes or brand-specific groups rather than in generic EXIF fields. Current examples include:

- `Sony:*`
- `Nikon:*`
- `Canon:*`
- `FujiFilm:*`
- `MakerNotes:*`

The browser worker currently runs ExifTool with:

- `-json`
- `-G1`
- `-a`
- `-s`
- `-u`
- `-sort`

This gives us:

- group-prefixed keys like `Nikon:ShutterCount`
- duplicate tag retention where needed
- short tag names
- unknown tags when ExifTool can still expose them
- stable enough raw output for extractor iteration
- a JSON payload small enough to send to the server without sending file bytes

## Accepted File Types

The current allowlist is:

- `jpg`
- `jpeg`
- `dng`
- `arw`
- `nef`
- `cr2`
- `cr3`
- `raf`

The current size cap is `100 MB`.

## Normalized Tag Model

Raw ExifTool output is normalized into flat tag-entry rows shaped as:

- `key`
- `group`
- `tag`
- `value`

Example:

```json
{
  "key": "Nikon:MechanicalShutterCount",
  "group": "Nikon",
  "tag": "MechanicalShutterCount",
  "value": 9371
}
```

The worker and parse route keep two normalized views:

- `allTags`: the full sanitized ExifTool output, excluding warning/error pseudo-tags
- `relevantTags`: a filtered subset used for extraction-focused debug output

The relevant-tag filter currently includes:

- metadata groups such as `EXIF`, `IFD0`, `Composite`, `MakerNotes`, `Sony`, `Nikon`, `Canon`, `FujiFilm`, `FujiIFD`, and `File`
- any tag named `Make` or `Model`
- any tag name containing `shutter`, `count`, `image`, or `exposure`

## Parse Transport

- the selected image or RAW file is not uploaded to `/exif-viewer/parse`
- the browser worker returns normalized `allTags` plus warnings
- the client posts a JSON payload containing:
  - `file.name`
  - `file.size`
  - `exiftool.parser`
  - `exiftool.allTags`
  - `exiftool.warnings`
- the server rebuilds `metadata.rows`, `relevantTags`, extraction state, and tracking preview from those normalized tags
- save/history persistence remains server-derived even though the metadata source is client-produced

## Brand Detection

Brand detection is currently heuristic and normalizes to:

- `sony`
- `nikon`
- `canon`
- `fujifilm`
- `unknown`

It primarily derives brand from:

- `EXIF:Make`
- `IFD0:Make`
- `MakerNotes:Make`
- `EXIF:Model`
- `IFD0:Model`
- `MakerNotes:Model`

Model strings are also used as brand hints where the make field is incomplete or missing.

## Count Normalization Rules

A count-like value is accepted only if it is:

- an integer value
- positive
- non-empty
- composed only of digits after removing spaces and commas

This means values like `12,345` normalize successfully, while values like `abc`, `12.5`, `0`, or negative numbers do not.

## Current Extraction Behavior By Brand

### Sony

The Sony extractor currently checks:

- `Sony:ShutterCount`
- `Sony:ShutterCount2`
- `Sony:ImageCount`
- `MakerNotes:ShutterCount`
- `MakerNotes:ShutterCount2`
- `MakerNotes:ImageCount`

### Nikon

Nikon is currently special-cased because mirrorless bodies may expose both:

- total count via `ShutterCount`
- mechanical-only count via `MechanicalShutterCount`

The current Nikon extractor checks:

- total candidates:
  - `Nikon:ShutterCount`
  - `MakerNotes:ShutterCount`
- mechanical candidates:
  - `Nikon:MechanicalShutterCount`
  - `MakerNotes:MechanicalShutterCount`

The parser treats these as separate useful values:

- `totalShutterCount`
- `mechanicalShutterCount`

If both are present, both are returned.

If only mechanical is present:

- the parse is still considered a success
- `mechanicalShutterCount` is populated
- `totalShutterCount` stays `null`
- the primary `shutterCount` field stays `null`

This avoids implying that mechanical-only count is always equivalent to total lifetime actuation count.

### Canon

The Canon extractor currently checks:

- `Canon:ShutterCount`
- `FileInfo:ShutterCount`
- `MakerNotes:ShutterCount`

Known current gap:

- some Canon `.cr2` files are not currently resolving a count with the existing candidate set
- this needs more investigation against real sample files before expanding Canon-specific logic

### Fujifilm

The Fujifilm extractor currently checks:

- `FujiFilm:ShutterCount`
- `FujiFilm:ExposureCount`
- `FujiFilm:ImageCount`
- `MakerNotes:ShutterCount`
- `MakerNotes:ExposureCount`

### Generic Fallback

If the brand-specific extractor does not find a valid count, a generic fallback scans relevant tags whose names include:

- `shuttercount`
- `imagecount`
- `exposurecount`
- `actuation`

This is useful for:

- unknown brands
- files where brand detection is weak
- cases where ExifTool exposes count-like fields outside the explicit brand candidate list

## Returned Data Shape

The parse route returns one JSON payload with these main sections:

- `file`
- `camera`
- `extractor`
- `tracking`
- `metadata`
- `debug`

Important fields:

- `status`
- `message`
- `file.name`
- `file.extension`
- `file.size`
- `camera.make`
- `camera.model`
- `camera.normalizedBrand`

Extractor fields:

- `extractor.selected`
- `extractor.primary`
- `extractor.fallbackUsed`
- `extractor.countType`
- `extractor.sourceTag`
- `extractor.mechanicalSourceTag`
- `extractor.shutterCount`
- `extractor.totalShutterCount`
- `extractor.mechanicalShutterCount`
- `extractor.failureReason`

Debug fields:

- `debug.parser`
- `debug.tagCount`
- `debug.warnings`
- `debug.relevantTags`
- `debug.attempts`

Metadata fields:

- `metadata.rows`

`metadata.rows` contains the full sanitized metadata row list, not only the extractor-relevant subset. This is what powers the summary card and full metadata table in the UI.

## Attempt-Level Debug Data

Each extractor attempt currently records:

- `extractorId`
- `candidateTags`
- `checks`
- `matchedTagCount`
- `countType`
- `sourceTag`
- `mechanicalSourceTag`
- `shutterCount`
- `totalShutterCount`
- `mechanicalShutterCount`
- `reason`

Each candidate check records:

- `countType`
- `candidateTag`
- `matchedTag`
- `rawValue`
- `normalizedValue`
- `valid`

This is the main structure used to understand why a given file succeeded or failed.

## Status Values

The route currently uses these stable statuses:

- `success`
- `unsupported_format`
- `file_too_large`
- `parse_error`
- `unsupported_brand`
- `not_found`
- `invalid_value`

## Testing Coverage

Current unit coverage lives in:

- `tests/unit/exif-viewer-extractors.test.ts`
- `tests/unit/exif-viewer-route.test.ts`
- `tests/unit/exif-viewer-exiftool.test.ts`

These tests currently cover:

- brand detection
- Sony, Nikon, Canon, and Fujifilm extraction paths
- Nikon total vs mechanical distinction
- generic fallback behavior
- JSON parse-route validation
- unsupported parser rejection
- unsupported format rejection
- empty file-envelope rejection
- file-size rejection
- shared normalization and warning extraction
- client worker-wrapper behavior
- `.dng` acceptance through the parse route

## Current Known Limitations

- Canon `.cr2` support is not fully validated yet for shutter count extraction
- the generic fallback may surface count-like fields that need brand-specific tightening later
- some manufacturers may expose useful count-like tags outside the current explicit candidate sets
- the normalized relevant-tag filter is intentionally broad and may include extra count-like fields for debugging

## Practical Summary

The current parser is strongest when:

- ExifTool/WASM can expose maker-note-backed shutter data directly in the browser
- brand detection is clear from `Make` and `Model`
- the count lives in one of the explicit brand candidate tags

The main areas still under investigation are:

- Canon `.cr2` count discovery
- broader brand-specific candidate expansion
- deciding when a generic count-like tag should be promoted into explicit extractor logic
