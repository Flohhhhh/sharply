## Camera Video Modes

The video specs system stores every advertised capture mode as an individual row in `camera_video_modes`. These rows power the public summary line, the detail matrix modal, and both editor experiences on the gear edit form.

### Table: `camera_video_modes`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `gear_id` | varchar(36) | References `gear.id`, cascades on delete |
| `resolution_key` | varchar(64) | Stable slug used for grouping (e.g. `4k`, `6k-open-gate`) |
| `resolution_label` | varchar(120) | Human label shown in UI (“4K UHD”, “6K Open Gate”) |
| `resolution_horizontal` | integer | Optional pixel width for ordering |
| `resolution_vertical` | integer | Optional pixel height for ordering |
| `fps` | integer | Frame rate for the mode |
| `codec_label` | varchar(120) | Contributor-provided codec or container name |
| `bit_depth` | integer | Bit depth for the codec (used for summary text) |
| `crop_factor` | boolean | `true` when the mode enforces a crop, otherwise `false` |
| `notes` | text | Freeform clarifications per mode |
| `created_at` / `updated_at` | timestamptz | Standard timestamps |

### Derived Surfaces

- **Specs Table Summary** – Groups rows by `resolution_key` and renders `resolution_label – up to {max fps} fps – {bit depth}-bit`.
- **Detail Modal** – Builds a static matrix with resolution columns and FPS rows. Each cell prints the codec label, bit depth, and whether a forced crop flag is set (a crop icon appears when `crop_factor` is `true`).
- **Guided Editor** – Walks contributors through selecting resolutions, fps ranges per resolution, codec/bit-depth combos, per-fps crop toggles, and finally previews the generated mode list before saving.
- **Advanced Editor** – Exposes a raw table where each mode row can be edited directly (resolution label/key, fps, codec, bit depth, crop flag, notes).

### Code Map

- **Helpers** – `src/lib/video/transform.ts` builds summary strings and the matrix data consumed by the UI.
- **Specs Table** – `src/lib/specs/registry.tsx` injects `<VideoSpecsSummary>` so every camera gear page shows the summary lines and modal launcher.
- **Detail Modal** – `src/app/(app)/(pages)/gear/_components/video/video-matrix-modal.tsx` renders the static matrix, legend, and `camera_specs.extra.videoNotes` copy.
- **Editors** – `src/app/(app)/(pages)/gear/_components/edit-gear/video-modes-manager.tsx` implements the guided flow and advanced table. It saves through `actionSaveVideoModes`.
- **Server Layer** – `src/server/video-modes/data.ts` + `service.ts` provide CRUD helpers, while `src/server/video-modes/actions.ts` expose read/save/regenerate actions to client components.

### Saving & Regeneration

1. Editors call the video mode save action, which replaces all existing rows for the gear inside a transaction.
2. The service returns the freshly normalized rows so the client can update its local view. The public page revalidates via `revalidatePath("/gear/[slug]")`.
3. No separate JSON cache (`camera_specs.video_matrix`) is written for now. The helper in `src/lib/video/transform.ts` recomputes line + matrix data on demand wherever it's needed. This keeps the pipeline simple while we validate the feature.

### Notes Field

`camera_specs.extra.videoNotes` (string) is rendered beneath the detail matrix when present. The video manager does not edit this field yet; editors can continue to set it through the general “Notes” textarea on the camera form if needed.

Future optimizations (such as caching a `video_matrix` JSON blob on `camera_specs`) can layer on top of this structure without changing contributor workflows.

