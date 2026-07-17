## Regional Naming System

Sharply maintains a single canonical gear record while also surfacing optional regional aliases for the United States, Europe, and Japan in every layer that touches gear naming.

### Schema and search plumbing

- `gear_aliases` (composite PK `gear_id + region`) stores `name` per `GearRegion` (`GLOBAL`, `US`, `EU`, `JP`). The alias rows are joined in the core fetchers (`fetchGearBySlug`, browse endpoints, alternatives, popularity/trending queries, comparison data, search results) via the helpers `fetchGearAliasesByGearIds`/`fetchGearAliasesByGearId`.
- Display helpers (`GetGearDisplayName`, `buildGearSearchName`, `normalizeGearSearchText`) consume `regionalAliases` so alias names can influence both the rendered label and the normalized search index. Search suggestions and commands now accept `countryCode`/locale to resolve the right alias.
- Search metadata (`metadata.tsx`, JSON-LD) now uses `GetGearDisplayName`, and rename workflows rebuild `search_name` after alias updates so results stay consistent.

### Locale tooling & regional routing

- `src/lib/locale/locales.ts` defines the supported locale options (US, UK, EU, DE, FR, ES, IT, CN, MY, JP, Global) with explicit MPB routing config and canonical `gearRegion`. The US locale maps to `US`; the Global locale remains `GLOBAL`. `CountryProvider` stores the locale id, resolves geo headers, and exposes `locale`, `localeId`, `countryCode`, and `gearRegion`.
- `CountrySelect` consumes this list (minus the Global option) so editors can choose US, UK, EU, or JP — each with consistent labels/flags — while `resolveRegionFromCountryCode` remains tolerant of `EU`/`UK` to keep alias resolution stable.
- Gear commerce links (`gear/_components/gear-links.tsx`) now pass the locale’s MPB market rather than the raw country code so JP or EU selections go through the right storefront.

### Editor experience and alias persistence

- The rename modal (`RenameGearDialog`) includes US, EU, and JP alias inputs alongside the canonical name field. Regional values are complete display names and are trimmed but otherwise stored exactly as entered, so an alias may use a different regional brand such as Rokinon. Canonical renames retain automatic brand prefixing. Submissions are allowed even when only aliases change.
- Alias edits are saved via `actionUpdateGearAliases` → `updateGearAliasesService`, which filters to allowed regions, performs upserts/deletes, and rebuilds `gear.searchName` using `buildGearSearchName` (re-using brand tokens + alias names). This service also revalidates `/admin/gear`, `/gear`, and `/browse`.
- The admin table and gear page pass current `regionalAliases` into the dialog so existing values prefill.

### Viewer-facing surfaces

- Gear cards, hero sections, horizontal lists, browse/trending tables, alternatives, compare pages, wishlist/collection lists, price/metadata sections, reviews/news cards, and image carousel alt text rely on `GetGearDisplayName` + `regionalAliases`, so US/EU/JP viewers automatically receive an exact regional alias when one exists and otherwise receive the canonical name.
- Specs table includes a dedicated “Regional Names” row so editors can verify stored aliases and the canonical fallback.
- Metadata/JSON-LD, compare metadata, and command palette/search suggestions use the region-aware display name to keep sharing/search consistent.

### Outcome

Aliases are now first-class: stored in the schema, surfaced in search/display, editable via the existing rename flow, and described for editors in this doc. That keeps data normalized while ensuring each viewer’s region sees the appropriate name without manual duplication.

### Implementation notes

- Alias rows are joined lazily (no extra joins on every query) by using `fetchGearAliasesByGearIds` whenever a gear payload is projected. That means the fetcher's graphql/resolution layer doesn’t need to know about aliases directly.
- The rename modal writes both `gear_aliases` and the `gear.search_name` in a transaction so we don’t ship stale search tokens in the autocomplete index.
- Breadcrumbs, metadata, compare tables, and design-system components now all call `GetGearDisplayName` with the locale-derived `gearRegion`, so switching the region/modes in `CountryProvider` automatically affects every surface.
