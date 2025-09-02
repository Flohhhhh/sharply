# Directus Types Generation

This guide explains how we generate TypeScript types for our Directus collections using Directus TypeForge, and how those types integrate with our codebase.

- **Generator**: Directus TypeForge ([GitHub repository](https://github.com/StephenGunn/directus-typeforge))
- **Output file**: `src/types/directus.ts`
- **Used by**: Directus SDK client in `src/lib/directus.ts`

## How It Works

1. **Source**: Pull schema from a live Directus server or a schema snapshot file
2. **Generation**: Run TypeForge to produce TypeScript interfaces
3. **Output**: Write to `src/types/directus.ts`
4. **Integration**: Import the generated `ApiCollections` when creating the Directus client

```ts
// Example usage (already in the repo)
import { createDirectus, rest } from "@directus/sdk";
import type { ApiCollections } from "@/types/directus";

const directus = createDirectus<ApiCollections>(
  "https://sharply-directus.onrender.com",
).with(rest());
```

## Prerequisites

- `directus-typeforge` is already included in `package.json`
- Access to the Directus instance via admin token or email/password, or a local schema snapshot JSON

## Option A — Generate from Live Server (Token)

Recommended for admins. Use an environment variable for the token.

```bash
export DIRECTUS_ADMIN_TOKEN=your-admin-token
npx directus-typeforge \
  --host https://sharply-directus.onrender.com \
  --token "$DIRECTUS_ADMIN_TOKEN" \
  -o ./src/types/directus.ts
```

## Option B — Generate from Live Server (Email/Password)

```bash
npx directus-typeforge \
  --host https://sharply-directus.onrender.com \
  --email you@example.com \
  --password 'your-password' \
  -o ./src/types/directus.ts
```

## Option C — Generate from Schema Snapshot

If you have a schema snapshot JSON locally:

```bash
npx directus-typeforge \
  -i ./directus-schema-snapshot.json \
  -o ./src/types/directus.ts
```

## Suggested NPM Script (Optional)

You can add a script for convenience. Keep secrets out of `package.json` and pass the token via env var when running.

```json
{
  "scripts": {
    "types:directus": "directus-typeforge --host https://sharply-directus.onrender.com --token $DIRECTUS_ADMIN_TOKEN -o ./src/types/directus.ts"
  }
}
```

Run it:

```bash
npm run types:directus
```

## Defaults and Flags

Directus TypeForge is optimized for SDK compatibility by default:

- **useTypeReferences (on)**: generates relation references; keep this enabled
- **makeRequired (on)**: fields are required by default
- **includeSystemFields (on)**: includes system fields for system collections
- **addTypedocNotes (on)**: adds JSDoc from field notes

Useful debug flags:

```bash
npx directus-typeforge -i ./directus-schema-snapshot.json \
  --debug --logLevel debug --logFile ./typeforge-debug.log \
  -o ./src/types/directus.ts
```

## When to Regenerate

- After changing the Directus data model (new/renamed/removed fields or collections)
- After enabling new relations or junction tables
- Before deploying if the backend schema changed

## Security Notes

- Do not commit tokens or sensitive values
- Prefer `--token "$DIRECTUS_ADMIN_TOKEN"` over embedding secrets in scripts

## References

- Directus TypeForge documentation and options: [StephenGunn/directus-typeforge](https://github.com/StephenGunn/directus-typeforge)
