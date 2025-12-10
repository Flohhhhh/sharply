# Max FPS (Photo) – Implementation Notes

## Data model

- Columns on `camera_specs`:
  - `max_fps_raw` (numeric) – headline max RAW fps
  - `max_fps_jpg` (numeric) – headline max JPG fps
  - `max_fps_by_shutter` (jsonb, nullable) – per-shutter fps matrix
- JSON shape (keys only for available shutters):
  - `mechanical`: `{ raw?: number | null, jpg?: number | null }`
  - `efc`: `{ raw?: number | null, jpg?: number | null }`
  - `electronic`: `{ raw?: number | null, jpg?: number | null }`
- Headline rules: `max_fps_raw` and `max_fps_jpg` mirror the maxima across all per-shutter entries.

## Editor UI

- Default mode: per-shutter inputs (RAW/JPG) shown when shutter types are set.
- Toggle: “Use per-shutter inputs”. When off, show unified RAW/JPG inputs and clear `max_fps_by_shutter`.
- On every per-shutter change, recompute headline `max_fps_raw` / `max_fps_jpg`.
- Available shutter types control which per-shutter cards render; removing a shutter removes its entry.

## Display (registry / specs table)

- Single shutter: inline `20 fps (Raw) / 120 fps (JPG)`; if equal, `20 fps`.
- Multiple shutters: vertical list with short labels `Mech.`, `EFC`, `Electronic`; values stack RAW and JPG when both exist. Labels muted, values bold/right-aligned with light row separators.
- Fallback: if per-shutter data is absent, use headline `max_fps_raw` / `max_fps_jpg`.

## Change preview (edit confirmation)

- `max_fps_by_shutter` rendered as human-readable lines (per shutter) instead of `[object Object]`.
- `max_fps_raw` / `max_fps_jpg` formatted with `fps` units.

## Notes

- All formatting helpers live in `src/lib/mapping/max-fps-map.ts`.
- Registry imports `formatMaxFpsDisplay` from that map to keep specs display logic centralized.
