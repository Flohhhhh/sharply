### AF Modes: Implementation Plan

This document outlines the plan to implement AF (Autofocus) Area Modes with brand-scoped dictionaries, de-duplication, and admin merge workflows.

### Goals

<!-- TODO: only schema is implemented already, need to handle the rest-->

- Provide a brand-scoped dictionary of AF area modes.
- Allow users to select from existing modes or propose a new one during gear creation/editing.
- Reduce duplicates via slugification, trigram similarity, and alias matching.
- Enable admins to manually merge possible duplicates while preserving historical links.
- Auto-assign brand on creation based on the camera brand.

### Schema Summary (done)

- `app.af_area_modes`: dictionary table with `name`, optional `brand_id`, `search_name`, `aliases`, `is_deprecated`.
- Duplicates allowed; de-duplicated later by admins via in-place mutation (soft-delete + reassign).
- `app.camera_af_area_specs`: pivot table for Camera ↔ AF modes.

### UX Plan

- Form control: searchable combobox of AF modes scoped by brand.
- Custom entry: if no good matches, show “Create new mode” with input for `name`; brand auto-filled from gear brand; slug auto-generated.
- Similarity hints: after typing, show “Possible duplicates” based on slug similarity, trigram similarity on `search_name`, and alias hits. Display brand context in the options.
- Inline moderation hint: flag if a chosen mode is `isDeprecated` and suggest its canonical replacement when available.

### De-duplication Strategy

- Compute `search_name = lower(name)` client-side and server-side.
- Candidate detection:
  - Trigram similarity on `search_name` (requires `pg_trgm`, extension already declared as `createExtensions`).
  - Alias search via `aliases` JSON array containment.
  - Optional client-side slugification for fuzzy compare; not stored in DB.
- Thresholds and ranking: start with conservative thresholds; prefer exact slug match, then alias hits, then trigram matches.

### Server Layering (Server Functions)

- data/: CRUD for `af_area_modes`, `camera_af_area_specs`.
- service/: business rules
  - Scope lookup by brand only (no default fallback)
  - Auto-assign `brand_id` from gear brand when creating a new mode via gear edit
  - Prevent selection of `is_deprecated` unless explicitly overridden; suggest canonical
  - Similarity search utilities (slug + trigram + alias)
  - In-place merge helpers (reassign + soft-deprecate)

### Admin Merge Workflow (in-place)

- Admin selects duplicate(s) and canonical target.
- Reassign `camera_af_area_specs` links from duplicates to canonical; delete conflicting duplicates.
- Mark duplicates as `is_deprecated = true` or soft-delete.
- Keep an audit entry for visibility.

### Background/Jobs

- Reconciliation job: for each row in `af_area_mode_merges`, upsert pivot rows to canonical target, then delete source pivot rows.
- Optional: compute and cache similarity suggestions periodically for moderation queues.

### Server Functions

- Get modes for brand.
- Suggest modes (with similarity hints) for a free-text query and brand.
- Propose/create new mode (brand inferred from gear brand).
- Assign/unassign modes to a gear.
- Admin: merge duplicates via in-place mutation.

### Validation and Constraints

- Enforce non-null `af_area_mode_id` in pivot.
- Maintain uniqueness constraints as defined in schema.
- Validate `name` length and slug generation.
- Prevent creation of exact duplicate `(brand_id, slug)`; surface suggestions instead.

### Rollout Steps

1. Migrate DB from schema changes.
2. Seed: add brand-scoped sets where helpful; otherwise add on demand.
3. Build data/ service/ actions layers as above.
4. Implement UX in camera create/edit form with combobox + create-new flow and similarity hints.
5. Add admin merge UI and background reconciliation.
6. Telemetry: log suggestions accepted vs overridden to tune thresholds.

### Notes

- Ensure `pg_trgm` extension is applied on deploy (already included as `createExtensions`).
- Keep documentation in sync with any future schema adjustments.
