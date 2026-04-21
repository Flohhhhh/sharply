# Date Formatting

## Shared module

Use `src/lib/format/date.ts` for product-facing date and time formatting.

Available exports:

- `parseDateLike`
- `formatDate`
- `formatDateWithPrecision`
- `formatRelativeDate`
- `formatDateInputValue`

## Accepted input types

The shared formatter accepts:

- `Date`
- epoch numbers
- ISO datetime strings
- `YYYY`
- `YYYY-MM`
- `YYYY-MM-DD`

Invalid input returns `null` from `parseDateLike` and the configured `fallback` from the formatter helpers.

## Time zone policy

- Absolute date and date-time formatting defaults to `UTC`.
- Use `timeZone: "local"` only when the UI is intentionally tied to the viewer's local device time.
- Current explicit local-time exception: EXIF tracking/chart surfaces.

## When to use each helper

- `formatDate`
  - Use for absolute date or date-time display with a named preset such as `date-long`, `date-medium`, or `datetime-short`.
- `formatDateWithPrecision`
  - Use when the source value carries a precision such as `YEAR`, `MONTH`, or `DAY`.
- `formatRelativeDate`
  - Use for locale-native relative output such as `2 hours ago`, `today`, `yesterday`, or `last week`.
  - With the default `style: "long"` and `numeric: "auto"`, the helper prefers calendar-style labels for recent dates.
  - Use `justNowLabel` when a caller explicitly wants `"just now"` instead of the locale runtime's default `"now"` phrasing.
  - Use `capitalize: true` when the relative label starts a sentence or standalone UI value and should render as `Today`/`Yesterday`.
- `formatDateInputValue`
  - Use when a controlled input needs a normalized `YYYY-MM-DD` string.

## Usage rules

- Pass an explicit `locale` at display call sites.
- Do not call `new Intl.DateTimeFormat(...)`, `new Intl.RelativeTimeFormat(...)`, `toLocaleDateString`, `toLocaleString`, or `date-fns` directly for product UI formatting.
- Keep parsing and formatting logic in `src/lib/format/date.ts` instead of duplicating small date helpers in components.
