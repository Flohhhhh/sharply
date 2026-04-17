# EXIF Viewer UI Implementation

## Overview

The EXIF viewer lives at `/exif-viewer` and is implemented as a small, route-local tool surface. The frontend is intentionally isolated from existing upload flows, media tooling, and admin UI. The page is split into a thin server-rendered shell and a client-side state/orchestration layer.

The current implementation is built around three primary visible states:

- `empty`
- `loading`
- `results`

There is also an error message path, but it does not introduce a separate primary surface. On error, the tool falls back to the empty upload surface and renders the error block beneath it.

## File layout

All route logic remains colocated under the route:

- `src/app/(app)/(pages)/(tools)/exif-viewer/page.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/client.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/types.ts`
- `src/app/(app)/(pages)/(tools)/exif-viewer/parse/route.ts`
- `src/app/(app)/(pages)/(tools)/exif-viewer/parse/exiftool.ts`
- `src/app/(app)/(pages)/(tools)/exif-viewer/parse/extractors.ts`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-empty-state.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-loading-state.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-results.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-metadata-table.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-tracking-history-dialog.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-preview-trigger.tsx`

## Rendering split

### `page.tsx`

`page.tsx` is the server-rendered shell. It is responsible for:

- page metadata
- top-of-page decorative background treatment
- persistent page heading
- local-only preview trigger for the loading state

This keeps the actual tool logic out of the server shell. The server shell does not parse files and does not own any tool-state transitions.

### `client.tsx`

`client.tsx` is the actual controller for the tool. It owns:

- file selection and drag/drop intake
- parse request submission
- loading-stage timing
- stale-request protection
- state transitions between empty, loading, results, and error
- reset behavior
- preview-loading behavior

This file is intentionally the orchestration layer rather than a large UI file. It decides which visual surface to render and passes data into the presentational components.

## Frontend state model

The tool currently derives a single view state from parsing, result, and error state:

```ts
const viewState = isParsing
  ? "loading"
  : result
    ? "results"
    : requestError
      ? "error"
      : "empty";
```

In practice the visible UX is:

- `empty`: upload/dropzone surface
- `loading`: animated loading card
- `results`: result presentation
- `error`: empty surface plus error block

This means the dropzone is hidden while results are visible and also hidden while loading is active. The heading remains persistent outside the state-swapped surface.

## File intake flow

The client keeps a hidden file input and exposes it through the empty-state UI.

Supported intake paths:

- clicking the dropzone
- pressing `Enter` or space on the dropzone
- clicking the browse button
- dragging a file over the dropzone
- dropping a file onto the dropzone

The shared file intake path is `handleSelectedFile(file)`, which immediately calls `parseFile(file)` when a file is present.

Allowed extensions and size constraints are shared through `types.ts`:

- `jpg`
- `jpeg`
- `dng`
- `arw`
- `nef`
- `cr2`
- `cr3`
- `raf`
- max size: `100 MB`

The file input `accept` attribute is generated from the same extension allowlist used by the server.

## Request flow

### 1. Client-side start

When a file is selected:

1. a new monotonic `runId` is created
2. old result and old error are cleared
3. loading is activated
4. the staged loading sequence starts immediately
5. the real network request starts immediately

The request is sent as `multipart/form-data` to:

- `POST /exif-viewer/parse`

### 2. Server-side parse route

`parse/route.ts` is a Node route and uses `exiftool-vendored` through `parse/exiftool.ts`.

Server responsibilities:

- validate file presence
- validate extension
- reject empty files
- reject oversized uploads
- write the uploaded file to a temp file
- read metadata via ExifTool with maker-note-friendly args
- normalize metadata rows
- run brand-specific shutter extraction
- build tracking preview state for the current user
- return a stable JSON payload for both success and failure

The route always returns a consistent response shape. Error responses include empty metadata rows rather than changing the payload contract. Successful responses now also include a tracking block that lets the results banner render the right save/login/history state without a second round-trip.

For signed-in users, that tracking block now supports two save modes:

- an explicit first save when the serial has never been tracked before
- automatic saving for later uploads once that serial is already tracked and the new reading is unique

### 3. Client-side completion

The client does not render the response as soon as the network call resolves. Instead it waits for both conditions:

- the request has completed
- the staged loading sequence has finished its minimum durations

Only then does it commit the final result or error into state.

This prevents the loading UI from flashing away too early and keeps the transition deliberate.

## Loading orchestration

The loading experience is not a simple spinner. It is a staged sequence with minimum durations:

- `Uploading file...` for `550ms`
- `Processing metadata...` for `700ms`
- `Generating report...` for `1150ms`

Total planned minimum time is `2400ms`.

The important behavior is:

- the request starts immediately
- the loading UI progresses through all stages
- early responses are held until the minimum sequence completes
- late responses keep the final loading stage visible until the request resolves

This is implemented in `client.tsx` through:

- `LOADING_STAGES`
- `runLoadingStages(runId)`
- `commitRunResult(...)`

### Stale-run protection

The client uses `loadingRunIdRef` as a stale-run guard. Every new parse increments the run id. Both the loading-stage runner and the request completion path check that the current run id still matches before mutating state.

This prevents:

- earlier requests overwriting newer results
- stage timers continuing after reset
- state updates after unmount

`mountedRef` is also used to avoid state updates after unmount.

## Preview-loading flow

For local development, the server shell can render a `Preview loading` button. This only appears outside production.

The preview flow is event-driven:

- `_components/exif-preview-trigger.tsx` dispatches a custom window event
- `client.tsx` listens for that event
- the client runs the same staged loading sequence without making a network request
- after the loading sequence completes, the client restores the previous result or previous error instead of forcing a reset

This makes it possible to test the loading animation against real result layouts.

## Reset flow

The current reset action is owned by the results UI, not the page header.

`ExifResults` receives `onStartOver` from `client.tsx`. Calling it:

- invalidates the current run id
- clears parsing state
- clears result
- clears error
- clears drag state
- resets the hidden file input value

This returns the tool to a clean empty state.

## Result tracking flow

The result surface owns the EXIF tracking actions rather than bouncing the user to another page.

The current behavior is:

- first save stays explicit
- later matching uploads for an already-tracked serial auto-save in the results view
- auto-save is limited to one attempt per parse-issued save token
- deleting the currently displayed reading suppresses auto-save for that same parse result so the deleted row is not recreated immediately

## Empty state

`_components/exif-empty-state.tsx` is the idle upload surface.

Current behavior:

- dotted muted border
- rounded card
- centered upload icon
- compact headline and instructions
- browse button
- full-card click target
- keyboard activation
- drag highlight state
- simple fade in/out via `motion.div`

The component is deliberately stateless. It receives all interaction handlers from the client controller.

## Loading state

`_components/exif-loading-state.tsx` is the non-interactive parsing surface.

Current behavior:

- same general footprint as the empty state
- solid card treatment instead of dotted border language
- four tall skeleton blocks that read like shutter-count digits
- staggered entrance from left to right
- muted shimmer gradient moving from bottom to top
- status text animated with vertical enter/exit motion
- small spinner underneath the status line

The component only renders visuals. It does not own timing, networking, or state progression.

### Reduced motion

The client passes `isReducedMotion` into the loading state using `useReducedMotion()` from `motion/react`.

When reduced motion is enabled:

- translations are simplified
- fade-only behavior is preferred
- the loading state still changes stages, but with less motion emphasis

## Result UI

`_components/exif-results.tsx` owns the result presentation once parsing succeeds or returns a structured no-count result.

It is composed of four sections:

1. hero result
2. reset control
3. model/serial banner
4. summary card
5. full metadata accordion table

### Hero count selection

The hero metric is chosen from the extractor payload with explicit precedence:

- `totalShutterCount`
- `mechanicalShutterCount`
- `shutterCount`

If both total and mechanical counts exist:

- total is the hero
- mechanical is rendered as a secondary metric underneath

If only one count exists:

- only that one is shown

If no usable count exists:

- the hero count is replaced with a bordered message callout
- summary and metadata still render so the tool remains useful for inspection

### Number animation

The main hero count uses `@number-flow/react`.

Implementation details:

- no random starting number
- deterministic seed based on digit count
- seed rule:
  - `0` for single-digit values
  - `10^(n-1)` for multi-digit values
- actual value is applied on the next animation frame after mount
- reduced-motion users get the final value immediately

This creates a clean “counting into place” effect without fake data.

### Result entrance animation

The result sections use lightweight `motion` entrance transitions:

- fade in
- slight upward translation when motion is allowed
- staggered delays between sections

The reset control is now inside the results component so it enters with the rest of the result layout rather than competing with the loading transition.

## Model and serial banner

The bordered banner above the summary card shows:

- camera model on the left
- camera serial number below it
- tracking state on the right

The right side is stateful:

- signed-out eligible results show `Log in to save history`
- signed-in eligible but untracked results show `Save to track`
- tracked-camera results show the mini chart plus a compact saved-reading summary

When a tracked camera is shown, the banner itself becomes the history trigger. It is keyboard-activatable and opens the history dialog without a separate `View history` button.

### Camera model source

The displayed camera model prefers the parsed response camera fields and falls back to metadata tag lookup when needed. The current UI intentionally prefers the model value rather than concatenating make and model.

### Serial number source

Serial number is resolved from the metadata rows using a prioritized list of common EXIF and maker-note keys, including:

- `MakerNotes:SerialNumber`
- `MakerNotes:InternalSerialNumber`
- `MakerNotes:CameraSerialNumber`
- `EXIF:SerialNumber`
- `ExifIFD:SerialNumber`
- brand-specific serial tags

## Summary card

The summary card is a bordered, minimal metadata block. It intentionally avoids a heavy visual treatment and currently uses border-only styling.

Displayed fields:

- Camera Model
- Lens
- Capture Date
- Exposure Time
- Aperture
- ISO

Layout:

- single column on smaller screens
- two columns from `md` upward

Formatting rules in the client:

- missing values render as `—`
- dates are converted to local readable date/time when parseable
- aperture values are normalized to `f/...` when needed
- ISO values are normalized to `ISO ...` when needed

## Full metadata table

`_components/exif-metadata-table.tsx` renders the full sanitized metadata payload.

Current behavior:

- collapsed by default inside a shadcn accordion
- row count displayed in the accordion trigger
- one table only
- two columns:
  - field identity
  - value
- left column shows:
  - tag
  - muted group name
- right column shows the formatted value with wrapping enabled
- the expanded table uses an internal scroll area rather than extending the full page indefinitely
- the table header is sticky while scrolling

The table uses the complete sanitized metadata row list returned by the server, not only extractor debug tags. This preserves maker-note-backed fields for inspection.

## Client/server contract used by the UI

The frontend currently depends on these main response areas:

- `status`
- `message`
- `camera`
- `extractor`
- `tracking`
- `metadata.rows`

### `extractor`

The result UI uses:

- `shutterCount`
- `totalShutterCount`
- `mechanicalShutterCount`

### `metadata.rows`

The result UI derives display content from full metadata rows for:

- camera model fallback
- lens
- capture date
- exposure time
- aperture
- ISO
- serial number
- full metadata table

This keeps the route payload generic and lets the frontend format presentation-specific summaries without server-side UI coupling.

### `tracking`

The tracking block now drives the EXIF banner state. It tells the client:

- whether the current result is trackable
- whether auth is required
- whether the parsed serial is already tracked by the current user
- whether the current reading is already saved
- whether a save token is available
- whether the parsed make/model mapped to a known gear item

The client uses this to render the correct CTA state without guessing from auth props or local heuristics.

## Tracking UI

Tracking is implemented directly inside the results banner rather than as a separate screen.

Current banner behavior:

- signed out + eligible result: `Log in to save history`
- signed in + eligible + never saved: `Save to track`
- signed in + tracked camera + current reading unsaved: auto-save during the unified loading flow, then tracked summary + mini chart
- signed in + current reading already saved: tracked summary + mini chart
- ineligible result: muted explanation

The save action posts the short-lived save token returned by the parse route to `/api/exif-tracking/save`.

History is lazy-loaded from `/api/exif-tracking/cameras/[trackedCameraId]/history` and rendered in `_components/exif-tracking-history-dialog.tsx`.

Tracked-camera results now also use that same history payload to render a compact banner sparkline. The chart data is derived client-side from saved readings using:

- `captureAt` when available
- `createdAt` as a fallback when EXIF capture time is missing
- daily aggregation rather than one point per saved reading
- highest available value per day for each plotted series

The banner mini chart is intentionally non-interactive and single-series. It prefers:

1. total shutter count
2. mechanical shutter count
3. generic shutter count

The history modal now adds a full line chart above the saved-readings table. When the saved dataset contains both total and mechanical values, the modal renders both series. Otherwise it falls back to a single line.

The history dialog is intentionally simple in v1:

- title from mapped gear name or parsed model
- summary fields for latest count, latest capture, first seen, and last seen
- full shutter-count chart above the table
- collapsed-by-default readings table
- per-reading delete action
- bounded dialog height with an internally scrolling readings table
- no separate chart modal beyond the history dialog itself

## Visual shell

The page shell adds a subtle striped background treatment behind the top of the tool to keep the surface from feeling flat.

Current implementation:

- low-opacity diagonal repeating stripes
- radial and linear mask shaping
- additional bottom gradient fade so the pattern dissolves into the page background

This decoration is contained in `page.tsx` and does not interact with the parsing flow.

## Design principles reflected in the current frontend

- route-local implementation over shared feature plumbing
- thin server shell, stateful client controller
- presentational components kept separate from orchestration
- explicit state machine instead of overlapping surfaces
- staged loading with deterministic minimum durations
- full metadata preserved for inspection, not hidden behind only a summary
- restrained motion with reduced-motion support

## Current limitations

- error handling is still visually lightweight and not yet elevated into its own full surface
- the empty-state copy is still more descriptive than the final polished version will likely be
- summary-field extraction is client-side and intentionally simple rather than fully normalized in a shared mapping layer
- some explanatory content on the static page is still compact and utilitarian rather than fully editorialized

## Future frontend directions

Likely next steps if the tool expands:

- refine the private history presentation now that save/history flows exist
- refine the empty-state copy and spacing
- improve error-state presentation
- add richer result affordances for linking parsed metadata to catalog gear
- extract client-side metadata summary helpers if the result UI grows beyond the current scope
