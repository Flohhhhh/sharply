## Regional Naming System

Sharply now maintains a single canonical gear record while also surfacing regional aliases for EU and Japan (plus automatic locale-aware fallbacks) in every layer that touches gear naming.

### Schema and search plumbing

- `gear_aliases` (composite PK `gear_id + region`) stores `name` per `GearRegion` (`GLOBAL`, `EU`, `JP`). The alias rows are joined in the core fetchers (`fetchGearBySlug`, browse endpoints, alternatives, popularity/trending queries, comparison data, search results) via the helpers `fetchGearAliasesByGearIds`/`fetchGearAliasesByGearId`.
- Display helpers (`GetGearDisplayName`, `buildGearSearchName`, `normalizeGearSearchText`) consume `regionalAliases` so alias names can influence both the rendered label and the normalized search index. Search suggestions and commands now accept `countryCode`/locale to resolve the right alias.
- Search metadata (`metadata.tsx`, JSON-LD) now uses `GetGearDisplayName`, and rename workflows rebuild `search_name` after alias updates so results stay consistent.

### Locale tooling & affiliate alignment

- `src/lib/locale/locales.ts` defines the five supported UI locales (US, UK, EU, JP, Global) with affiliate market mappings (`mpbMarket`, Amazon host) and canonical `gearRegion`. `CountryProvider` stores the locale id, resolves geo headers (including `EU`/`UK` pseudo codes), and exposes `locale`, `localeId`, `countryCode`, and `gearRegion`. The legacy `countryCode` setters now resolve to the locale map.
- `CountrySelect` consumes this list (minus the Global option) so editors can choose US, UK, EU, or JP — each with consistent labels/flags — while `resolveRegionFromCountryCode` remains tolerant of `EU`/`UK` to keep alias resolution stable.
- Gear affiliate links (`gear/_components/gear-links.tsx`) now pass the locale’s MPB market rather than the raw country code so JP or EU selections go through the right storefront.

### Editor experience and alias persistence

- The rename modal (`RenameGearDialog`) now includes EU and JP alias inputs alongside the new name field. Input text is automatically prefixed with the brand name (matching the canonical rename behavior). Submissions are allowed even when only aliases change, and the CTA enables whenever there’s any difference vs. the stored alias values.
- Alias edits are saved via `actionUpdateGearAliases` → `updateGearAliasesService`, which filters to allowed regions, performs upserts/deletes, and rebuilds `gear.searchName` using `buildGearSearchName` (re-using brand tokens + alias names). This service also revalidates `/admin/gear`, `/gear`, and `/browse`.
- The admin table and gear page pass the current `regionalAliases` + `brandName` into the dialog so existing alias values prefill.

### Viewer-facing surfaces

- Gear cards, hero sections, horizontal lists, browse/trending tables, alternatives, compare pages, wishlist/collection lists, price/metadata sections, reviews/news cards, and image carousel alt text now rely on `GetGearDisplayName` + `regionalAliases`, so EU/Japan viewers automatically see the correct name.
- Specs table now includes a dedicated “Regional Names” row that mirrors the spacing/typography of other rows. It lists the EU alias, Japan alias, and (for non-global viewers) the base name so editors can verify all names at a glance.
- Metadata/JSON-LD, compare metadata, and command palette/search suggestions use the region-aware display name to keep sharing/search consistent.

### Outcome

Aliases are now first-class: stored in the schema, surfaced in search/display, editable via the existing rename flow, and described for editors in this doc. That keeps data normalized while ensuring each viewer’s region sees the appropriate name without manual duplication.
