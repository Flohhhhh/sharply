#!/usr/bin/env bash
set -euo pipefail

# Only production and a prepared staging commit should deploy through Vercel.
# Pull request deployments and development branch pushes are always ignored.

echo "VERCEL_ENV: ${VERCEL_ENV:-}"
echo "VERCEL_GIT_COMMIT_REF: ${VERCEL_GIT_COMMIT_REF:-}"
echo "VERCEL_GIT_COMMIT_MESSAGE: ${VERCEL_GIT_COMMIT_MESSAGE:-}"
echo "VERCEL_GIT_PULL_REQUEST_ID: ${VERCEL_GIT_PULL_REQUEST_ID:-}"

# Vercel treats exit 0 as "ignore this build" and exit 1 as "continue".
if [[ -n "${VERCEL_GIT_PULL_REQUEST_ID:-}" ]]; then
  echo "🚫 Ignored: pull request deployment #${VERCEL_GIT_PULL_REQUEST_ID}"
  exit 0
fi

if [[ "${VERCEL_GIT_COMMIT_REF:-}" == "main" ]]; then
  echo "✅ Allowed: production build from main"
  exit 1
fi

# A push/merge into staging is prepared by GitHub Actions first. Only the
# resulting marker commit may deploy, ensuring generated migrations are present.
if [[ "${VERCEL_GIT_COMMIT_REF:-}" == "staging" ]] && [[ "${VERCEL_GIT_COMMIT_MESSAGE:-}" == chore\(staging\):\ prepared* ]]; then
  echo "✅ Allowed: prepared staging build"
  exit 1
fi

echo "🚫 Ignored: only main or a prepared staging commit may deploy"
exit 0
