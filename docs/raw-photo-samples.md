# Raw Photo Samples

Raw photo samples are unprocessed camera files (DNG, CR2, NEF, etc.) that users can download to evaluate camera image quality and processing characteristics.

## Schema

**Raw Samples Table** (`app.raw_samples`):
- `id` (varchar, PK) - UUID
- `fileUrl` (text, required) - UploadThing URL
- `originalFilename` (varchar)
- `contentType` (varchar)
- `sizeBytes` (integer)
- `uploadedByUserId` (varchar, FK to users)
- `isDeleted` (boolean) - Soft delete flag used before permanent cleanup
- `deletedAt` (timestamp) - Timestamp used by the cleanup job
- `createdAt`, `updatedAt`

**Junction Table** (`app.gear_raw_samples`):
- `gearId` (varchar, FK to gear)
- `rawSampleId` (varchar, FK to raw_samples)
- `createdAt`
- Composite primary key on both columns

## Restrictions

- **Gear Type**: CAMERA only (validated in `addRawSampleToGear` service)
- **Permissions**: ADMIN or SUPERADMIN required for upload
- **File Size**: Max 128MB per file (enforced by UploadThing)
- **Contribution Tracking**: Raw sample uploads count toward gear contributions and badge awards

## Upload Flow

1. User uploads via UploadThing endpoint `rawSampleUploader` (defined in `src/app/api/uploadthing/core.ts`)
2. UploadThing returns file metadata (URL, name, size, type)
3. Client calls `actionAddGearRawSample()` with file metadata
4. Service layer validates gear type is CAMERA
5. Data layer creates `raw_samples` record and `gear_raw_samples` link
6. Contribution badge event evaluated

## Delete + Cleanup Flow

1. Editor removes a raw sample from a gear page
2. Data layer removes the `gear_raw_samples` link
3. The `raw_samples` row is soft-deleted via `isDeleted = true` and `deletedAt = now()`
4. Weekly cron `GET /api/admin/raw-samples/cleanup` loads soft-deleted rows
5. Cleanup service extracts the UploadThing file key from each stored `fileUrl`
6. Cleanup service performs a final guard check that the sample has no remaining `gear_raw_samples` associations
7. UploadThing `UTApi.deleteFiles()` permanently removes the blob
8. The corresponding `raw_samples` row is hard-deleted after UploadThing confirms deletion

## Service Functions

**Location**: `src/server/gear/service.ts`

```typescript
fetchRawSamples(slug) => RawSample[]
addRawSampleToGear(slug, payload) => RawSample
removeRawSampleFromGear(slug, sampleId) => { ok: true }
```

**Cleanup Location**: `src/server/raw-samples/service.ts`

```typescript
cleanupDeletedRawSamples({ dryRun?, limit?, deletedBefore? }) => CleanupDeletedRawSamplesResult
```

**Payload Type**:
```typescript
{
  fileUrl: string
  originalFilename?: string
  contentType?: string
  sizeBytes?: number
}
```

## Server Actions

**Location**: `src/server/gear/actions.ts`

```typescript
actionAddGearRawSample(slug, payload)
actionRemoveGearRawSample(slug, sampleId)
```

Both revalidate `/gear/${slug}` after mutation.

## Data Functions

**Location**: `src/server/gear/data.ts`

```typescript
fetchRawSamplesByGearId(gearId)
insertRawSample(params) // Creates raw_samples record + junction link
deleteRawSample(sampleId, gearId) // Removes junction + soft-deletes raw_samples row
```

**Cleanup Data Location**: `src/server/raw-samples/data.ts`

```typescript
fetchDeletedRawSamplesForCleanup({ limit?, deletedBefore? })
hardDeleteRawSampleById(sampleId)
```

## Operations

- Manual dry-run: `npm run raw-samples:cleanup`
- Manual apply: `npm run raw-samples:cleanup -- --apply`
- Weekly automation: `vercel.json` schedules `/api/admin/raw-samples/cleanup` every Monday at 02:00 UTC
- Security: cron route requires `Authorization: Bearer ${CRON_SECRET}`
- Environment: permanent deletion uses `UPLOADTHING_TOKEN` on the server

## Display

Raw samples appear on gear detail pages with download buttons. The UI shows filename and file size, allowing users to download original camera files for evaluation.
