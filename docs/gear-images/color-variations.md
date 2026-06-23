# Gear Color Variations

Gear colorways describe visual variants of one product identity. They do not create separate searchable gear records or specification pages.

## Modes and image ownership

- **Implicit mode:** a gear item has no `gear_colorways` rows. The public carousel reads `gear.thumbnailUrl`, `gear.topViewUrl`, and `gear.rearViewUrl`.
- **Explicit mode:** a gear item has one or more ordered colorway rows. The public carousel reads only colorway images. The lowest `sortOrder` is the default.
- Enabling explicit mode creates the first stored colorway from the current gear images.

The first colorway's front, top, and rear images are mirrored to the legacy gear fields. This keeps browse cards, search results, metadata, and JSON-LD aligned with the visible default. Changing the default clears a stale dedicated OG image so metadata falls back to the mirrored thumbnail.

## Schema

`gear_colorways` stores a gear foreign key, stable per-gear slug, display name, two normalized `#RRGGBB` swatch colors, sort order, optional front/top/rear image URLs, and timestamps. Rear images are valid only for `CAMERA` and `ANALOG_CAMERA` gear.

Schema changes are made only in `src/server/db/schema.ts`. Agents must not generate or apply the migration; the project owner runs the normal Drizzle migration workflow.

## Administration

Editors can enable colorways, add or rename rows, edit swatches, reorder rows, and upload images. Admins can additionally delete rows, remove images, and reset explicit mode. The final row cannot be deleted directly.

Reset defaults to deleting every colorway row after copying the default colorway's images onto the base gear fields. Admins can instead choose a different colorway to apply first, or keep the base gear photos currently stored on the gear record.

All mutations use `server/admin/colorways` through data → service → actions. Lifecycle and image mutations create audit records; image uploads and replacements create contribution payloads under `colorwayImageUpload`.

## Public carousel

When explicit colorways exist, the public view renders left-aligned color pills below the media area in stored order. Pills for colorways with at least one supported image target that colorway's first slide, and Embla selection events update the active pill. Colorways without any supported image still render as disabled pills, but they do not add placeholder slides or fall back to legacy gear images.
