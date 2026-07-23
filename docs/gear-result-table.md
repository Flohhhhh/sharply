# Gear Result Table

The reusable gear list presentation lives in `src/components/table`. It is used by browse release feeds, browse category/mount results, and search results without changing how any surface fetches or paginates data.

## Public component contract

`GearTable` receives `GearTableRow[]`. Rows are JSON-safe and include identity/display data, all mount names, card-compatible date and price metadata, camera fields, and lens fields. `toGearTableRows` adapts the existing browse or search payloads into this contract.

The shared server helper `src/server/gear/listing-table-service.ts` enriches each existing result page in one batch. Mounts are read from `gear_mounts`; the legacy `gear.mountId` is not used for table display. The table formats canonical mount values with the shared mount display helper, shows at most three mounts per row, and provides a `[+N]` overflow indicator with the full list in a tooltip.

## Scopes and columns

- Camera and analog-camera-only results: Name, Brand, Mount, Sensor Format, Megapixels, Year, Weight, Price.
- Lens-only results: Name, Brand, Mount(s), Focal Length, Aperture, Type, Year, Price.
- Mixed result sets: Name, Brand, Mount(s), Type, Year, Price.

The scope is resolved from the currently loaded rows. Unknown values render as an em dash. Dates and prices reuse the gear-card formatting rules.

## Behavior boundaries

TanStack Table performs only in-memory sorting of rows already loaded by the owning browse or search surface. It does not add filtering, pagination, URL parameters, or requests. As the existing surface loads another page, the active client sort is applied to the expanded row set.

The grid/list preference is stored under `sharply:gear-results-view` in localStorage. It defaults to grid during server render and is shared by all result surfaces in a browser.

When list view is active, initial and incremental loading use `GearTableSkeleton` instead of card skeletons. The skeleton mirrors the current table shape, uses subtle pulsing rows, and fades at the bottom to keep long result loading states visually lightweight.

## Adding another surface

1. Make its server payload include the standard table fields with `attachGearListingTableFields`.
2. Convert the loaded items with `toGearTableRows`.
3. Use `useGearResultsView` and `GearViewToggle` beside that surface's existing controls.
4. Render `GearTable` only as an alternative to the existing renderer; keep the fetch, filters, empty states, and pagination owned by the route.
