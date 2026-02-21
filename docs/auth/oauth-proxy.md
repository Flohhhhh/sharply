# OAuth Proxy (Sharply)

This document describes Sharply's Better Auth OAuth proxy setup for production + preview deployments.

## Why This Exists

Social OAuth providers require pre-registered callback URLs. Preview deployments (for example `*.vercel.app`) are dynamic, so we cannot register every preview callback URL.

The Better Auth `oAuthProxy` plugin solves this by:
- sending the provider callback to the canonical production callback URL,
- then securely forwarding users back to the original requesting origin.

## Current Implementation

Source: `src/auth.ts`

- Better Auth uses an explicit canonical base URL:
  - `baseURL` resolves from `BETTER_AUTH_URL` first, then `NEXT_PUBLIC_BASE_URL`.
- `oAuthProxy` is enabled:
  - `oAuthProxy({ productionURL: canonicalAuthBaseUrl, maxAge: 60 })`
- OAuth provider redirect URIs are explicit and canonical:
  - Google: `${canonicalAuthBaseUrl}/api/auth/callback/google`
  - Discord: `${canonicalAuthBaseUrl}/api/auth/callback/discord`
- `trustedOrigins` is normalized and includes:
  - canonical origin (`BETTER_AUTH_URL`/`NEXT_PUBLIC_BASE_URL`),
  - `AUTH_ADDITIONAL_TRUSTED_ORIGINS` (comma-separated),
  - localhost in non-production.

The auth route remains standard Better Auth setup:
- `src/app/(app)/api/auth/[...all]/route.ts`
- `export const { POST, GET } = toNextJsHandler(auth)`

## Required Environment Variables

In production:
- `BETTER_AUTH_URL` (required in `src/env.js`)  
  Example: `https://www.sharplyphoto.com`
- `NEXT_PUBLIC_BASE_URL`  
  Keep this aligned with `BETTER_AUTH_URL`.
- `AUTH_ADDITIONAL_TRUSTED_ORIGINS` (optional but recommended for previews)  
  Example: `https://sharplyphoto-ten.vercel.app`

Also ensure normal auth vars are present (`AUTH_SECRET`, provider IDs/secrets, etc.).

## OAuth Provider Configuration

Register canonical callback URLs in each provider dashboard:

- Discord:
  - `https://www.sharplyphoto.com/api/auth/callback/discord`
- Google:
  - `https://www.sharplyphoto.com/api/auth/callback/google`

If canonical host changes (for example `www` vs apex), update:
1. `BETTER_AUTH_URL`
2. provider callback URLs
3. any related trusted origins

## Security Notes

- OAuth proxy requires skipping state cookie checks during proxied flows (Better Auth plugin behavior).
- Keep `trustedOrigins` tightly scoped to known origins only.
- Keep proxy payload age short (`maxAge: 60`) to limit replay window.
- Do not broaden trusted origins with wildcard domains unless necessary.

## Debugging Notes

Temporary auth callback debug logging is present in:
- `src/auth.ts` (`[auth-callback-debug] trusted_origins_config`)
- client auth callback resolver/logging paths

When flow is stable in production, remove or reduce temporary debug logs.

## Troubleshooting Checklist

1. OAuth redirects to wrong host:
   - verify `BETTER_AUTH_URL` value in production.
2. `Invalid callbackURL` / origin errors:
   - verify `AUTH_ADDITIONAL_TRUSTED_ORIGINS` contains the requesting origin.
3. Provider rejects redirect URI:
   - verify canonical callback URL is registered exactly (scheme, host, path).
4. State mismatch on preview:
   - confirm `oAuthProxy` is enabled and deployed with current auth config.
