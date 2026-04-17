# EXIF Tracking Plan

## Summary

Build EXIF tracking as a separate, private, serial-aware feature layered onto `/exif-viewer`, not as an extension of `ownerships` and not as public per-camera history.

V1 includes:

- EXIF model-to-gear mapping via a dedicated alias table
- explicit first save flow for signed-in users from the EXIF results view
- automatic saving of later matching readings after that first save
- private saved camera history per user
- a basic history UI using the existing EXIF banner plus a simple dialog/list
- no automatic storage of every parse
- no public serial history
- no chart UI in the first slice

## Key adjustments from the original idea

- Tracking is private. Per-serial history is never public in v1.
- EXIF model mapping does not live on `camera_specs`; it lives in a dedicated alias table.
- Tracking stays separate from `ownerships`.
- The parse response includes whether the current reading is already saved.
- Reading dedupe is based on tracked-camera identity plus reading identity, not just serial hash, so different users do not collide.

## Implemented data model

### `app.gear_exif_aliases`

Purpose:

- maps EXIF make/model identifiers to canonical gear items
- keeps metadata aliasing separate from regional display aliases and spec tables

Columns:

- `id`
- `gearId`
- `normalizedBrand`
- `makeRaw`
- `modelRaw`
- `makeNormalized`
- `modelNormalized`
- `createdAt`
- `updatedAt`

Behavior:

- exact normalized `make + model` match first
- exact normalized `model` fallback only when unique
- unresolved aliases do not block tracking saves

### `app.exif_tracked_cameras`

Purpose:

- stores one private tracked camera per user per hashed serial

Columns:

- `id`
- `userId`
- `gearId`
- `normalizedBrand`
- `makeRaw`
- `modelRaw`
- `serialHash`
- `firstSeenAt`
- `lastSeenAt`
- `createdAt`
- `updatedAt`

Privacy:

- only hashed serials are stored
- plaintext serial numbers are never persisted in tracking tables

### `app.exif_shutter_readings`

Purpose:

- stores private shutter-count history points for a tracked camera

Columns:

- `id`
- `trackedCameraId`
- `dedupeKey`
- `captureAt`
- `primaryCountType`
- `primaryCountValue`
- `shutterCount`
- `totalShutterCount`
- `mechanicalShutterCount`
- `sourceTag`
- `mechanicalSourceTag`
- `createdAt`
- `updatedAt`

Dedupe:

- dedupe key is derived from:
  - `trackedCameraId`
  - primary count type
  - primary count value
  - normalized capture timestamp or `none`

This avoids cross-user collisions that would happen if dedupe were based only on serial hash.

## Server architecture

The implementation follows the repo’s data/service split:

- `src/server/exif-tracking/data.ts`
- `src/server/exif-tracking/service.ts`

API routes:

- `src/app/(app)/api/exif-tracking/save/route.ts`
- `src/app/(app)/api/exif-tracking/cameras/[trackedCameraId]/history/route.ts`

The existing parse route remains the entrypoint for EXIF extraction:

- `src/app/(app)/(pages)/(tools)/exif-viewer/parse/route.ts`

It now also builds a tracking preview block.

## Parse response contract

`ExifViewerResponse` now includes:

```ts
tracking: {
  eligible: boolean;
  reason:
    | "missing_serial"
    | "missing_count"
    | "not_signed_in"
    | "unsupported_result"
    | null;
  saveToken: string | null;
  matchedGear: {
    id: string;
    slug: string;
    name: string;
  } | null;
  trackedCamera: {
    id: string;
    readingCount: number;
    latestPrimaryCountValue: number | null;
    latestCaptureAt: string | null;
  } | null;
  currentReadingSaved: boolean;
};
```

Meaning:

- `eligible` means the parse result has enough data to support tracking
- `reason = "not_signed_in"` means the result is trackable but requires auth to save
- `matchedGear` is best-effort alias resolution
- `trackedCamera` is only populated for signed-in users who already track that serial
- `currentReadingSaved` lets the banner distinguish between “camera already tracked” and “this exact reading already saved”

## Token design

The client never submits raw EXIF payloads for persistence.

The parse route mints a short-lived signed token that includes:

- serial hash
- make/model snapshot
- normalized brand
- matched gear id
- capture timestamp
- primary count selection
- full count payload
- source tags
- issued-at and expiry
- version

The save route only accepts this token.

## Save flow

1. User uploads a file and receives a parse result with a tracking block.
2. If signed in and eligible, the banner shows `Save to track` or `Save reading`.
3. Client posts the save token to `/api/exif-tracking/save`.
4. Server verifies token signature and expiry.
5. Server upserts the tracked camera by `(userId, serialHash)`.
6. Server computes the dedupe key for the current reading.
7. Server inserts the reading if it is new, otherwise no-ops.
8. Server returns updated tracking summary with `currentReadingSaved: true`.

Auto-save behavior:

- the first tracked reading is still an explicit user action
- once a serial is already tracked for the signed-in user, later uploads of that same camera auto-save new readings
- dedupe still prevents repeated inserts for the same reading identity
- if the user deletes the currently displayed reading, auto-save is suppressed for that same parse result so the row is not recreated immediately

## History flow

1. User clicks `View history` from the EXIF banner.
2. Client fetches `/api/exif-tracking/cameras/[trackedCameraId]/history`.
3. Server enforces owner access via `userId`.
4. Server returns camera summary plus saved readings ordered by capture date descending, nulls last.
5. Client renders the history in a dialog.

## UI behavior

Banner states in the EXIF results view:

- signed out, eligible: `Log in to save history`
- signed in, eligible, unsaved camera: `Save to track`
- signed in, tracked camera, current reading unsaved: `Save reading` plus `View history`
- signed in, tracked camera, current reading already saved: `View history`
- ineligible: muted explanatory text

The history dialog shows:

- title from mapped gear name or camera model
- reading count
- latest count
- latest capture
- first seen
- last seen
- simple readings table
- per-reading delete action

No charting is included in v1.

## Deferred items

Explicitly deferred:

- public anonymous history views
- banner sparkline
- large chart modal
- percentile comparisons
- expected shutter life messaging
- automatic sync to collection ownership

## Verification

The implementation includes:

- route tests for parse, save, and history
- result helper tests
- pure helper tests for tracking normalization, dedupe, and token signing

Typecheck and the EXIF-focused unit test slice should remain green as the feature evolves.
