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
- `isDeleted` (boolean) - Soft delete flag
- `deletedAt` (timestamp)
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

1. User uploads via UploadThing endpoint `rawSampleUploader` (defined in `src/app/(app)/api/uploadthing/core.ts`)
2. UploadThing returns file metadata (URL, name, size, type)
3. Client calls `actionAddGearRawSample()` with file metadata
4. Service layer validates gear type is CAMERA
5. Data layer creates raw_samples record and gear_raw_samples link
6. Contribution badge event evaluated

## Service Functions

**Location**: `src/server/gear/service.ts`

```typescript
fetchRawSamples(slug) => RawSample[]
addRawSampleToGear(slug, payload) => RawSample
removeRawSampleFromGear(slug, sampleId) => { ok: true }
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
deleteRawSample(sampleId, gearId) // Removes junction + raw_samples record
```

## Display

Raw samples appear on gear detail pages with download buttons. The UI shows filename and file size, allowing users to download original camera files for evaluation.
