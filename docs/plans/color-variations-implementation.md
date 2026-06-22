# Plan: Gear Color Variations

> Source PRD: color variation plan refined in agent discussion on June 22, 2026

## Architectural decisions

Durable decisions that apply across all phases:

- **Modes**: gear images operate in two modes
  - implicit mode: no colorway rows; `gear.thumbnailUrl`, `gear.topViewUrl`, and `gear.rearViewUrl` are the public source
  - explicit mode: one or more colorway rows exist; colorway rows are the public source
- **Default colorway**: no `isDefault` field; default visible colorway is the row with the lowest `sortOrder`
- **Entry into explicit mode**: enabling color variations creates the first colorway row from the current gear image fields
- **Exit from explicit mode**: colorways are reset only by an explicit admin action; deleting down to one row does not auto-collapse back to implicit mode
- **Public identity**: colorways do not create separate gear items, slugs, public spec pages, search entries, or compare rows
- **Legacy gear image fields**: while explicit mode is active, `gear.thumbnailUrl` must mirror the first colorway front image so browse cards, metadata, JSON-LD, and search thumbnails stay aligned with the visible default
- **Gear type rules**:
  - front view applies to all gear
  - top view applies to cameras and lenses
  - rear view applies only to `CAMERA` and `ANALOG_CAMERA`
- **Server layering**: all new reads and writes follow `data -> service -> actions`; UI and generic libs must not access the database directly
- **File storage**: colorway image replacement and deletion must use an explicit cleanup path for orphaned UploadThing files; existing raw-sample cleanup logic does not cover gear images
- **Admin editing model**: color and image management remain staff-only tools surfaced from the existing gear admin/moderation UI

---

## Phase 1: Schema and server model

**User stories**: store named color variants without creating duplicate gear items; preserve the current single-image behavior for most items; support default-by-sort-order.

### What to build

Introduce explicit colorway persistence and server contracts while leaving the public gear page behavior unchanged. Add a new colorway model tied to gear with name, slug, swatch colors, sort order, and image URLs. Add read models that can resolve whether a gear item is in implicit or explicit mode, and provide a normalized image/colorway payload for future UI work.

### Acceptance criteria

- [ ] A new colorway table exists in the schema with gear relation, name, slug, swatch metadata, sort order, front image URL, top view URL, rear view URL, and timestamps
- [ ] Rear-view validation is enforced for colorways the same way it is for base gear images
- [ ] Server `data` and `service` layers can fetch gear image state as either implicit or explicit mode
- [ ] Explicit mode resolves a deterministic default colorway from lowest `sortOrder`
- [ ] Tests cover implicit mode gear, explicit mode with one row, explicit mode with multiple rows, and lens rear-view rejection

---

## Phase 2: Admin colorway lifecycle

**User stories**: enable colors from existing gear images; manage colorway names, swatches, order, and deletion; reset back to implicit mode explicitly.

### What to build

Add admin mutations and UI for entering explicit mode, editing colorway metadata, reordering rows, deleting rows, and resetting colors. Enabling colors should create the first explicit colorway from the current gear image fields. Reset should support both reverting to existing gear images and promoting a chosen colorway back onto the gear row before deleting colorways.

### Acceptance criteria

- [ ] Staff can enable color variations for an implicit-mode gear item, which creates the first colorway from current gear image fields
- [ ] Staff can edit colorway name, swatch color A, swatch color B, and sort order
- [ ] Staff can delete colorway rows without triggering automatic collapse to implicit mode
- [ ] Staff can explicitly reset colors using either:
  - keep current gear image fields and remove colorways
  - copy a selected colorway back to `gear` and remove colorways
- [ ] Server actions revalidate the affected gear page and admin listing surfaces
- [ ] Audit logging and contribution payloads cover colorway creation, update, reorder, delete, and image changes
- [ ] Tests cover enable flow, delete flow, reorder/default resolution, reset-to-base flow, and promote-colorway-back flow

---

## Phase 3: Colorway image management

**User stories**: upload and manage per-colorway images with the same basic admin affordances as current gear images; avoid leaving stray storage objects behind.

### What to build

Extend the existing image-management flow so it becomes mode-aware. In implicit mode it edits gear image fields as today. In explicit mode it edits the selected colorway row. Add cleanup behavior for replaced or removed colorway images so UploadThing files do not accumulate as strays.

### Acceptance criteria

- [ ] The image management UI shows base gear image fields in implicit mode and colorway-scoped image fields in explicit mode
- [ ] The first colorway front image is mirrored back to `gear.thumbnailUrl` whenever the default colorway or its front image changes
- [ ] Top and rear gear fields are mirrored from the first colorway if that consistency policy is adopted during implementation
- [ ] Replacing or removing a colorway image schedules or performs cleanup for the old UploadThing file
- [ ] Existing gear image behavior remains unchanged for implicit-mode items
- [ ] Tests cover image upload, replace, remove, default-colorway mirroring, and cleanup invocation

---

## Phase 4: Public gear page colorway experience

**User stories**: browse named colors as pills; navigate the carousel by color section; keep the current clean single-carousel experience when no explicit colors exist.

### What to build

Update the public gear image experience to resolve image display from the normalized mode-aware server payload. Implicit mode continues to render the current carousel with no pills. Explicit mode renders a continuous carousel grouped by colorway sections and exposes pills that scroll to the relevant section and reflect active position.

### Acceptance criteria

- [ ] Implicit mode renders no color pills and keeps the current image carousel behavior
- [ ] Explicit mode with one colorway renders the colorway-backed carousel without pills
- [ ] Explicit mode with multiple colorways renders pills with swatch preview and color name
- [ ] Clicking a pill scrolls to the first slide in that colorway section instead of replacing the image set
- [ ] Manual carousel navigation updates the active pill based on the current colorway section
- [ ] Partial image sets per colorway are handled without breaking section-to-pill mapping
- [ ] Tests cover no-colorway, one-colorway, multi-colorway, pill activation, and mixed view availability

---

## Phase 5: Metadata, browse parity, and docs

**User stories**: keep browse cards, metadata, and downstream surfaces aligned with the visible default colorway; document the new system clearly for future contributors.

### What to build

Finish the integration work outside the gear page itself. Ensure all browse/search/SEO surfaces continue to read a thumbnail that matches the first visible colorway. Update the relevant docs so schema, image handling, and moderation flows reflect the new model.

### Acceptance criteria

- [ ] Gear metadata, JSON-LD, search results, browse cards, and related listing surfaces show the same default image the public gear page starts on
- [ ] Any gear image request logic remains correct when explicit colorways exist
- [ ] `docs/gear-specification-system.md` documents implicit mode vs explicit mode and the new colorway table
- [ ] `docs/top-view-images.md` documents colorway-backed image behavior and cleanup responsibilities
- [ ] Any admin or mapping docs that describe gear image management are updated to avoid drift
- [ ] Tests cover metadata and browse thumbnail parity for explicit-mode items
