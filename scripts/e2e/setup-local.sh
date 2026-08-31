#!/usr/bin/env bash
# One-command local mirror of the e2e CI pipeline.
# Spins up a disposable Postgres (port 5433 — never clashes with the dev DB),
# then runs: pg_trgm -> constants -> drizzle push -> payload bootstrap -> seed.
# Docs: docs/e2e-testing.md   Spec: docs/superpowers/specs/2026-08-31-e2e-ci-design.md
set -euo pipefail

CONTAINER_NAME="sharply-e2e-postgres"
DB_PORT="${E2E_DB_PORT:-5433}"

export DATABASE_URL="postgres://postgres:postgres@localhost:${DB_PORT}/sharply_e2e"
export PAYLOAD_SECRET="${PAYLOAD_SECRET:-e2e-local-secret}"
export AUTH_SECRET="${AUTH_SECRET:-e2e-local-auth-secret}"
export OPENAI_API_KEY="${OPENAI_API_KEY:-e2e-local-dummy}"
export NEXT_PUBLIC_BASE_URL="${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}"
export SKIP_ENV_VALIDATION=1

if [ -n "$(docker ps -aq -f name="^${CONTAINER_NAME}$")" ]; then
  docker start "${CONTAINER_NAME}" >/dev/null
  echo "[e2e] reusing container ${CONTAINER_NAME}"
else
  docker run -d --name "${CONTAINER_NAME}" \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=sharply_e2e \
    -p "${DB_PORT}:5432" \
    postgres:17-alpine >/dev/null
  echo "[e2e] started container ${CONTAINER_NAME} on port ${DB_PORT}"
fi

echo "[e2e] waiting for postgres..."
for _ in $(seq 1 60); do
  if docker exec "${CONTAINER_NAME}" pg_isready -U postgres -d sharply_e2e >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
docker exec "${CONTAINER_NAME}" pg_isready -U postgres -d sharply_e2e >/dev/null

docker exec "${CONTAINER_NAME}" psql -U postgres -d sharply_e2e \
  -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" >/dev/null
echo "[e2e] pg_trgm ready"

npm run constants:generate
npx drizzle-kit push --force --config=config/drizzle.config.ts
npm run e2e:bootstrap
npm run db:seed -- --confirm-seed

cat <<EOF

[e2e] database ready: ${DATABASE_URL}

CI-identical run (production build):
  DATABASE_URL="${DATABASE_URL}" SKIP_ENV_VALIDATION=1 npx next build --webpack
  DATABASE_URL="${DATABASE_URL}" PAYLOAD_SECRET="${PAYLOAD_SECRET}" AUTH_SECRET="${AUTH_SECRET}" \\
    PLAYWRIGHT_SERVER_COMMAND="npm run start:e2e" npm run test:e2e

Tear down when done:
  docker rm -f ${CONTAINER_NAME}
EOF
