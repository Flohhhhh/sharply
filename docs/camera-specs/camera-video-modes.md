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
- **Detail Modal** – Builds a static matrix with resolution columns (sorted ascending using pixel dimensions or parsed “K/P” labels) and FPS rows (sorted descending). Each cell is filled with a shared bit-depth color (`src/lib/video/colors.ts`), prints `{bit depth}-bit`, and shows a Lucide `Crop` icon when `crop_factor` is `true`.
- **Guided Editor** – Walks contributors through (1) selecting resolutions via the custom multi-select, (2) choosing FPS sets per resolution, (3) painting bit depth and forced-crop states on the matrix-style editor, and (4) previewing the auto-generated per-mode list before saving. Clicking a cell toggles the current brush value, ensuring every resolution × FPS combo expands into the right number of mode rows.
- **Matrix Editor** – The painting grid replaces the old “advanced table.” It mirrors the display matrix so contributors can rapidly assign bit depths and crop flags with brush controls (mutually exclusive bit-depth vs crop brushes, clear toggles, drag-to-fill).

### Code Map

- **Color Config** – `src/lib/video/colors.ts` centralizes the bit-depth buckets for both the editor and public detail modal.
- **Helpers** – `src/lib/video/transform.ts` builds summary strings and the matrix data consumed by the UI, including resolution sorting heuristics.
- **Specs Table** – `src/lib/specs/registry.tsx` injects `<VideoSpecsSummary>` so every camera gear page shows the summary lines and modal launcher.
- **Detail Modal** – `src/app/(app)/(pages)/gear/_components/video/video-matrix-modal.tsx` renders the static matrix, legend, and `camera_specs.extra.videoNotes` copy.
- **Editors** – `src/app/(app)/(pages)/gear/_components/edit-gear/video-modes-manager.tsx` implements the guided flow plus the shared `VideoBitDepthMatrix` painter that replaces the old advanced table. The manager now stages modes in the main gear edit form instead of writing directly to the database.
- **Form Integration** – `src/app/(app)/(pages)/gear/_components/edit-gear/edit-gear-form.tsx` normalizes staged modes, includes them in the diff payload, and previews the pending rows in the confirmation dialog.
- **Proposal Pipeline** – `src/server/db/normalizers.ts` validates and normalizes the `videoModes` payload, while `src/server/admin/proposals/data.ts` applies the rows during approval by replacing `camera_video_modes`.
- **Server Layer** – `src/server/video-modes/data.ts` + `service.ts` provide CRUD helpers, while `src/server/video-modes/actions.ts` expose read/save/regenerate actions to client components.

### Saving & Regeneration

1. Contributors stage their matrix edits inside the gear form. When the main form is submitted, `videoModes` is included in the proposal payload (diff-only).
2. `normalizeProposalPayloadForDb` parses the array, enforces the shared constraints, and stores the normalized rows on the proposal.
3. When the proposal is approved (either auto-approved for admins/editors or via the review UI), the approval data layer replaces every row in `camera_video_modes` for that gear before revalidating the public routes.
4. No separate JSON cache (`camera_specs.video_matrix`) is written for now. The helper in `src/lib/video/transform.ts` recomputes line + matrix data on demand wherever it's needed. This keeps the pipeline simple while we validate the feature.

### Notes Field

`camera_specs.extra.videoNotes` (string) is rendered beneath the detail matrix when present. The video manager does not edit this field yet; editors can continue to set it through the general “Notes” textarea on the camera form if needed.

Future optimizations (such as caching a `video_matrix` JSON blob on `camera_specs`) can layer on top of this structure without changing contributor workflows.

