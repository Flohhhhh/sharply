#!/usr/bin/env bash
set -euo pipefail

# Automatic Git deployments are limited to production. Development previews are
# triggered explicitly through a Vercel Deploy Hook when the release PR is prepared.

echo "VERCEL_ENV: ${VERCEL_ENV:-}"
echo "VERCEL_GIT_COMMIT_REF: ${VERCEL_GIT_COMMIT_REF:-}"
echo "VERCEL_GIT_PULL_REQUEST_ID: ${VERCEL_GIT_PULL_REQUEST_ID:-}"

# Vercel treats exit 0 as "ignore this build" and exit 1 as "continue".
if [[ "${VERCEL_GIT_COMMIT_REF:-}" == "main" ]] && [[ -z "${VERCEL_GIT_PULL_REQUEST_ID:-}" ]]; then
  echo "✅ Allowed: production build from main"
  exit 1
fi

echo "🚫 Ignored: automatic deployment disabled outside main"
exit 0
