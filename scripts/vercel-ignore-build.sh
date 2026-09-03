#!/usr/bin/env bash
set -euo pipefail

# Direct pushes to these branches should build. Pull request deployments are
# ignored regardless of their source or target branch.
ALLOWED_BRANCHES=("main" "development")

echo "VERCEL_ENV: ${VERCEL_ENV:-}"
echo "VERCEL_GIT_COMMIT_REF: ${VERCEL_GIT_COMMIT_REF:-}"
echo "VERCEL_GIT_PULL_REQUEST_ID: ${VERCEL_GIT_PULL_REQUEST_ID:-}"

branch_is_allowed () {
  local candidate="$1"
  for b in "${ALLOWED_BRANCHES[@]}"; do
    if [[ "$candidate" == "$b" ]]; then
      return 0
    fi
  done
  return 1
}

# Vercel treats exit 0 as "ignore this build" and exit 1 as "continue".
# Check pull request metadata first so a PR can never be allowed merely because
# its commit ref happens to match an allowed branch name
if [[ -n "${VERCEL_GIT_PULL_REQUEST_ID:-}" ]]; then
  echo "🚫 Ignored: pull request deployment #${VERCEL_GIT_PULL_REQUEST_ID}"
  exit 0
fi

# Direct pushes to main/development should build.
if [[ -n "${VERCEL_GIT_COMMIT_REF:-}" ]] && branch_is_allowed "$VERCEL_GIT_COMMIT_REF"; then
  echo "✅ Allowed: direct branch build for ${VERCEL_GIT_COMMIT_REF}"
  exit 1
fi

# Fail closed when branch metadata is missing, and ignore all other branches.
echo "🚫 Ignored: commit ref is missing or is not main/development"
exit 0
