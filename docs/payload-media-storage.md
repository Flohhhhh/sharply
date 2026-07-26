# Payload media storage

Payload CMS stores files from the `media` collection in a public Vercel Blob
store. UploadThing remains in use elsewhere for profile pictures and raw photo
samples.

## Configuration

Connect a Blob store to the Vercel project and make these values available to
the deployment:

- `BLOB_READ_WRITE_TOKEN` enables Payload uploads and the migration command.
- `BLOB_STORE_ID` is optional Vercel integration metadata. Payload does not
  read it because the store ID is encoded in the read/write token.
- `BLOB_WEBHOOK_PUBLIC_KEY` is optional Vercel integration metadata and is not
  read by the Payload storage adapter.

All three values are optional in application-wide environment validation. When
the read/write token is absent, Sharply explicitly disables the Blob adapter and
Payload uses local media storage instead. The main application can therefore
start without Blob credentials, while production deployments should configure
the token so CMS media remains durable across deployments.

Payload uses direct client uploads to avoid Vercel's server upload-size limit.
New uploads receive random Blob pathname suffixes to prevent collisions. The
legacy migration intentionally preserves exact Payload filenames so existing
records continue to resolve without a database rewrite.

The public Blob store hostname is explicitly allowed in `next.config.js` under
`images.remotePatterns`. This allows Payload media to be rendered through
Next.js image optimization in production. If the connected Blob store changes,
update the hostname there to match the new store URL before deploying.

## Migrating legacy Payload images

The migration is non-destructive: it reads Payload records and UploadThing
files, writes copies to Blob, and never changes database records or deletes
source objects.

First inspect the migration:

```bash
npm run payload:media:migrate-to-blob
```

The dry run validates records, checks for duplicate filenames, and reports
objects already present in Blob. It reports remaining objects as skipped.

Copy and verify the remaining objects:

```bash
npm run payload:media:migrate-to-blob -- --apply
```

The command exits unsuccessfully if a record lacks its legacy UploadThing key
or filename, a download fails, or source/destination sizes do not match. It is
safe to run again: a destination with the expected size is reported as already
present, while an incorrect destination is overwritten and verified.

Do not deploy the Blob adapter until the apply run reports zero failures. After
deployment, verify existing media in `/cms`, upload an image larger than 4.5 MB,
and delete a newly uploaded test record to exercise Blob deletion.

## Rollback and cleanup

The legacy hidden `_key` remains on media records so the migration can derive
their UploadThing URLs and the storage cutover can be rolled back. To roll
back, restore the UploadThing adapter in `src/payload.config.ts`; no database
rewrite is necessary.

Keep the copied Payload objects in UploadThing for an observation period.
Legacy cleanup must identify only the keys attached to Payload `media` records.
It must not delete profile-picture or raw-sample objects, which continue to use
UploadThing. Source deletion is deliberately outside the migration command.
