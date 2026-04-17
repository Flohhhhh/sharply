# EXIF Tracking System Overview

## Summary

EXIF tracking is a private, serial-aware layer built on top of `/exif-viewer`.

It lets a signed-in user:

- identify a camera from EXIF metadata and serial-derived maker-note fields
- save shutter-count readings for that specific camera
- build a private reading history over time
- view that history in the EXIF results UI with a banner summary, mini chart, full chart, and readings table

The system is intentionally separate from:

- `ownerships`
- public per-camera history
- generic gear aliasing
- camera specification storage

This keeps EXIF-derived identity, private tracking, and catalog ownership concerns distinct.

## Core principles

- Tracking is private. Per-serial history is only visible to the owning user.
- Tracking is serial-aware. History is attached to a specific physical camera, not just a camera model.
- Tracking is explicit first, automatic later. The first save is user-triggered; later matching uploads can auto-save once the camera is already tracked.
- Plaintext serial numbers are not persisted in tracking tables.
- EXIF model matching is best-effort. Gear matching improves the experience but is not required for tracking to work.
- Saved readings are client-asserted. The server trusts client-produced normalized metadata enough to derive tracking state and persistence inputs.

## System boundaries

### What EXIF tracking does

- consumes parse output from `/exif-viewer/parse`
- derives eligibility for tracking from serial + shutter-count availability
- resolves a best-effort gear match from EXIF make/model aliases
- issues a short-lived signed save token instead of trusting raw client payloads
- stores tracked cameras and shutter readings for the signed-in user
- returns private history for display in the EXIF viewer

### What EXIF tracking does not do

- create public serial history pages
- imply verified ownership
- auto-add the camera to `ownerships`
- rely on `camera_specs` for EXIF alias matching
- persist every parse automatically for first-time users

## Data model

### `app.gear_exif_aliases`

Purpose:

- maps EXIF make/model identifiers to canonical gear items
- keeps EXIF metadata aliasing separate from public display aliases and spec data

Key fields:

- `gearId`
- `normalizedBrand`
- `makeRaw`
- `modelRaw`
- `makeNormalized`
- `modelNormalized`

Behavior:

- exact normalized `make + model` match is preferred
- exact normalized `model` fallback is allowed only when the result is unique
- unresolved alias matches do not block tracking

### `app.exif_tracked_cameras`

Purpose:

- stores one tracked camera per user per hashed serial

Key fields:

- `userId`
- `gearId`
- `normalizedBrand`
- `makeRaw`
- `modelRaw`
- `serialHash`
- `firstSeenAt`
- `lastSeenAt`

Behavior:

- uniqueness is per `(userId, serialHash)`
- the same physical camera tracked by two users remains isolated
- `gearId` is optional because mapping can fail while tracking still succeeds

Privacy:

- only hashed serials are stored
- plaintext serial values are not persisted in EXIF tracking tables

### `app.exif_shutter_readings`

Purpose:

- stores private historical readings for a tracked camera

Key fields:

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

Behavior:

- stores the selected primary count for ordering and history summaries
- preserves total and mechanical values when both are available
- supports cameras that only expose a generic shutter count

### Dedupe model

Readings are deduped with a deterministic key derived from:

- tracked-camera identity
- primary count type
- primary count value
- normalized capture timestamp or `none`

This prevents duplicate inserts for the same effective reading while avoiding cross-user collisions.

## Server architecture

The EXIF tracking backend follows the repo’s `data/` and `service/` split.

Primary files:

- `src/server/exif-tracking/data.ts`
- `src/server/exif-tracking/service.ts`

HTTP entrypoints:

- `src/app/(app)/(pages)/(tools)/exif-viewer/parse/route.ts`
- `src/app/(app)/api/exif-tracking/save/route.ts`
- `src/app/(app)/api/exif-tracking/cameras/[trackedCameraId]/history/route.ts`
- `src/app/(app)/api/exif-tracking/readings/[readingId]/route.ts`

Responsibility split:

- parse route: EXIF extraction + tracking preview construction
- save route: token-backed persistence
- history route: owner-only history fetch
- delete route: owner-only reading deletion

## Parse-time tracking preview

`/exif-viewer/parse` returns an EXIF result plus a tracking block so the results UI can render the correct tracking state without an extra round-trip.

That parse result is now built from browser-local ExifTool/WASM metadata. The server still recomputes:

- normalized serial identity
- gear alias match
- primary count selection
- dedupe inputs
- save token payload

Current tracking payload:

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
}
```

Meaning:

- `eligible` means the current parse contains enough data to support tracking
- `reason` explains why saving is unavailable
- `saveToken` is a short-lived signed token for the current reading
- `matchedGear` is optional alias-based gear resolution
- `trackedCamera` indicates that this user already tracks the serial
- `currentReadingSaved` distinguishes “camera tracked” from “this exact reading already stored”

## Save token model

The client never sends arbitrary EXIF payloads back for persistence.

Instead, the parse route issues a short-lived signed token that contains the server-approved save candidate, including:

- hashed serial identity
- make/model snapshot
- normalized brand
- resolved gear id if available
- capture timestamp
- primary count selection
- full count payload
- source tags
- token version and expiry

The save API accepts only this token.

## Tracking lifecycle

### 1. Parse

The user selects a file locally. The browser parses it with ExifTool/WASM and sends only normalized metadata to `/exif-viewer/parse`.

The parse route:

- computes shutter-count results
- checks whether the result is eligible for tracking
- checks whether the signed-in user already tracks the camera
- checks whether the current reading already exists
- returns a tracking preview block

### 2. First save

If the user is signed in, eligible, and the serial has not been tracked yet:

- the results banner shows `Save to track`
- the client posts the parse-issued token to `/api/exif-tracking/save`
- the server upserts `exif_tracked_cameras`
- the server inserts the first reading if it is new

### 3. Later matching uploads

Once the same signed-in user already tracks that camera:

- new uploads of that serial can auto-save during the unified results-loading flow
- auto-save only runs when the reading is new
- the results view is committed after parse, optional auto-save, and initial history loading are all complete

This keeps the user on one consistent loading path rather than showing results first and mutating the tracking state afterward.

### 4. Reading deletion

Users can delete individual saved readings from the history modal.

Important behavior:

- deletion is owner-only
- if the deleted row is the currently displayed reading, auto-save is suppressed for that same parse result
- this prevents the row from being recreated immediately from the still-active parse payload

## History retrieval

Tracked history is fetched from:

- `/api/exif-tracking/cameras/[trackedCameraId]/history`

The server:

- validates ownership by `userId`
- returns tracked-camera summary information
- returns saved readings in descending history order for inspection

The chart layer separately transforms those readings into ascending, chart-friendly points.

## UI integration

The tracking UI lives inside the EXIF results surface rather than on a separate page.

Primary client files:

- `src/app/(app)/(pages)/(tools)/exif-viewer/client.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-results.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-tracking-mini-chart.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-tracking-history-dialog.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-tracking-history-chart.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-tracking-chart-utils.ts`

### Banner states

The banner above the summary card reflects the current tracking state:

- signed out + eligible: login CTA
- signed in + eligible + untracked: `Save to track`
- signed in + tracked + current reading already saved: tracked summary + mini chart
- signed in + tracked + current reading new: auto-save during unified loading, then tracked summary + mini chart
- ineligible: muted explanatory state

### History modal

The history modal currently includes:

- tracked camera title
- summary metrics
- full chart
- collapsed-by-default readings list
- per-reading delete action

The dialog and the readings table are now bounded so long histories scroll internally rather than pushing the modal off-screen.

## Chart system

The tracking UI currently includes two chart surfaces:

- a compact mini chart in the banner
- a full history chart in the modal

### Mini chart

The mini chart is intentionally simple:

- single series only
- no axes, legend, or tooltip
- daily-collapsed points
- visible points with a tight y-domain
- used as a compact trend preview

Series priority:

1. total shutter count
2. mechanical shutter count
3. generic shutter count

### Full chart

The full history chart:

- uses the same derived history data
- renders one or two series depending on available saved values
- shows visible points
- uses a real time-scaled x-axis
- uses a clamped non-negative y-axis domain
- prefers local-day chart anchors so dates match the user’s calendar day

When both total and mechanical values exist, both series render together.

### Chart aggregation rules

The chart utilities collapse saved readings down to one plotted point per day.

For a single day:

- the highest available value per series wins
- chart points are ordered ascending by plotted day
- chart spacing reflects actual elapsed time rather than equally spaced categories

This keeps charts readable while avoiding noisy same-day point clusters.

## Relationship to gear mapping

EXIF tracking uses `gear_exif_aliases` for optional model-to-gear resolution.

This is intentionally different from:

- `camera_specs`
- display-name aliases
- ownership records

Why:

- EXIF model names are metadata identifiers, not canonical specs
- tracking must still work when the model cannot be mapped
- ownership and tracking answer different product questions

## Current user-visible behavior

Today, the system supports:

- explicit first save for a new tracked camera
- automatic saving of later unique readings for that tracked camera
- private reading history
- mini and full historical charts
- reading deletion
- best-effort gear matching
- safe save tokens instead of raw client persistence

## Non-goals and current exclusions

The current system does not provide:

- public serial history
- public ownership inference
- automatic collection ownership creation
- cohort percentiles
- expected shutter life messaging
- chart range selectors, zooming, or annotations

## Reference files

Schema and server:

- `src/server/db/schema.ts`
- `src/server/exif-tracking/data.ts`
- `src/server/exif-tracking/service.ts`

Routes:

- `src/app/(app)/(pages)/(tools)/exif-viewer/parse/route.ts`
- `src/app/(app)/api/exif-tracking/save/route.ts`
- `src/app/(app)/api/exif-tracking/cameras/[trackedCameraId]/history/route.ts`
- `src/app/(app)/api/exif-tracking/readings/[readingId]/route.ts`

UI:

- `src/app/(app)/(pages)/(tools)/exif-viewer/client.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-results.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-tracking-mini-chart.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-tracking-history-dialog.tsx`
- `src/app/(app)/(pages)/(tools)/exif-viewer/_components/exif-tracking-history-chart.tsx`
