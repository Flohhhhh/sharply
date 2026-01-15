#!/usr/bin/env bash
set -euo pipefail

# Allowed branches to build for:
ALLOWED_BRANCHES=("main" "development")

echo "VERCEL_ENV: ${VERCEL_ENV:-}"
echo "VERCEL_GIT_COMMIT_REF: ${VERCEL_GIT_COMMIT_REF:-}"
echo "VERCEL_GIT_PULL_REQUEST_ID: ${VERCEL_GIT_PULL_REQUEST_ID:-}"
echo "VERCEL_GIT_PROVIDER: ${VERCEL_GIT_PROVIDER:-}"
echo "VERCEL_GIT_REPO_OWNER: ${VERCEL_GIT_REPO_OWNER:-}"
echo "VERCEL_GIT_REPO_SLUG: ${VERCEL_GIT_REPO_SLUG:-}"

branch_is_allowed () {
  local candidate="$1"
  for b in "${ALLOWED_BRANCHES[@]}"; do
    if [[ "$candidate" == "$b" ]]; then
      return 0
    fi
  done
  return 1
}

# 1) Direct pushes to main/development should build.
if [[ -n "${VERCEL_GIT_COMMIT_REF:-}" ]] && branch_is_allowed "$VERCEL_GIT_COMMIT_REF"; then
  echo "✅ Allowed: direct branch build for ${VERCEL_GIT_COMMIT_REF}"
  exit 1
fi

# 2) If this deployment is for a PR, only build when the PR targets main/development.
# Vercel provides the PR ID, but not the target branch directly, so we ask the Git provider API.
# PR id is available as VERCEL_GIT_PULL_REQUEST_ID. :contentReference[oaicite:1]{index=1}
if [[ -n "${VERCEL_GIT_PULL_REQUEST_ID:-}" ]]; then
  if [[ "${VERCEL_GIT_PROVIDER:-}" != "github" ]]; then
    echo "⚠️ Non-GitHub provider detected. Defaulting to build (adjust script if needed)."
    exit 1
  fi

  if [[ -z "${GITHUB_TOKEN:-}" ]]; then
    echo "⚠️ GITHUB_TOKEN is not set. Defaulting to build so PRs do not get silently skipped."
    exit 1
  fi

  owner="${VERCEL_GIT_REPO_OWNER}"
  repo="${VERCEL_GIT_REPO_SLUG}"
  pr="${VERCEL_GIT_PULL_REQUEST_ID}"

  echo "Fetching PR target branch from GitHub API: ${owner}/${repo} PR #${pr}"

  pr_json="$(
    curl -sS \
      -H "Authorization: Bearer ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/${owner}/${repo}/pulls/${pr}"
  )"

  target_branch="$(
    node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write((j.base && j.base.ref) ? j.base.ref : "");' \
      <<<"$pr_json"
  )"

  if [[ -z "$target_branch" ]]; then
    echo "⚠️ Could not determine PR target branch. Defaulting to build."
    exit 1
  fi

  echo "PR target branch: ${target_branch}"

  if branch_is_allowed "$target_branch"; then
    echo "✅ Allowed: PR targets ${target_branch}"
    exit 1
  fi

  echo "🚫 Ignored: PR targets ${target_branch} (not in allowed list)"
  exit 0
fi

# 3) Everything else (feature branches without PRs, random branches, etc.) should be ignored.
echo "🚫 Ignored: not main/development and not an allowed PR"
exit 0
