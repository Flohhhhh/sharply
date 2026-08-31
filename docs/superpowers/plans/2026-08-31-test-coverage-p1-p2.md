# Test Coverage Expansion (Phases 1–2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unit-coverage reporting and a broad read-level Playwright sweep over every page so upcoming changes can't silently break the site.

**Architecture:** Phase 1 wires `@vitest/coverage-v8` reporting (no thresholds) into the existing Vitest setup and CI. Phase 2 builds a data-driven e2e read sweep: a single route manifest feeds per-area spec files through one `expectPageRenders` helper, a Vitest parity guard diffs the manifest against the real `src/app` route tree, and e2e-only DB/Payload fixtures make every dynamic route renderable. Phase 3 (unit gap-fill) is a separate plan, written after the Phase 1 coverage map exists.

**Tech Stack:** Vitest 2.1.9, `@vitest/coverage-v8`, Playwright 1.57, Drizzle ORM, Payload 3.74, Next.js 16, npm (NOT pnpm — this repo is npm).

**Spec:** `docs/superpowers/specs/2026-08-31-test-coverage-design.md`

## Global Constraints

- Package manager is **npm** (`npm@10.8.1`); never use pnpm here.
- All PRs target `development`; open them with `npm run pr:create` (runs the e2e suite first).
- Coverage is **reporting only** — never add `coverage.thresholds`.
- Sweep tests the **default locale (en, unprefixed paths)**; one dedicated spec covers a second locale (`ja`).
- `tests/playwright/utils/route-manifest.ts` must contain **no runtime import of `@playwright/test`** (type-only imports are fine) — the Vitest parity guard imports it in a node environment.
- Vitest only picks up `tests/unit/**/*.test.ts` (see `config/vitest.config.ts`); Playwright only picks up `tests/playwright/**`.
- Seeded canonical entities (from `scripts/seed.ts` / `scripts/e2e/bootstrap-payload.ts`): gear `nikon-z6iii` named `Nikon Z6III` (id `ec11113e-ae24-44cb-871f-4eb763d2d378`), gear `canon-eos-r6-mark-iii`, `nikon-zr`; news post titled `Sharply E2E seed news post`; users `seed.reviewer+1@sharply.dev` / `+2` (role EDITOR, no handles).
- Local e2e stack: `npm run e2e:setup-local` (Docker Postgres on 5433), then `npm run test:e2e`. If Docker is down: `orb start` (OrbStack, not Docker Desktop).
- Error-boundary copy (en): `Something went wrong!` / `Try again` (`messages/en.json` → `error.genericTitle` / `error.tryAgain`).
- Commit messages end with:
  `Claude-Session: https://claude.ai/code/session_01Fsdf8P31xDoZcbizEnE1TU`

---

## Phase 1 — Coverage reporting (PR 1, branch `test/p1-coverage-reporting`)

### Task 1: Vitest coverage config + script

**Files:**
- Modify: `package.json` (devDependency + script)
- Modify: `config/vitest.config.ts`

**Interfaces:**
- Produces: `npm run test:coverage` — runs the unit suite with v8 coverage; text summary on stdout; `coverage/` output dir (gitignored).

- [ ] **Step 1: Create the branch**

```bash
git checkout development && git pull && git checkout -b test/p1-coverage-reporting
```

- [ ] **Step 2: Install the provider (exact version match with vitest)**

```bash
npm install -D @vitest/coverage-v8@2.1.9
```

- [ ] **Step 3: Add the script to `package.json`** (next to the existing `test:unit` entries)

```json
"test:coverage": "vitest run --coverage --config=config/vitest.config.ts",
```

- [ ] **Step 4: Add the coverage block to `config/vitest.config.ts`** inside the existing `test: {}` object

```ts
    coverage: {
      provider: "v8",
      // `all`-style reporting: files matched by `include` that no test imports
      // must appear at 0% — the empty domains are the whole point of the map.
      include: ["src/server/**", "src/lib/**", "src/hooks/**"],
      exclude: [
        "src/lib/generated/**",
        "**/*.d.ts",
      ],
      reportsDirectory: path.resolve(workspaceRootPath, "coverage"),
      reporter: process.env.CI
        ? ["text-summary", "json-summary", "html"]
        : ["text-summary"],
    },
```

- [ ] **Step 5: Verify untested files appear at 0%**

Run: `npm run test:coverage 2>&1 | tail -20`
Expected: suite passes; a coverage summary prints. Then confirm an empty
domain is present in the report:

```bash
CI=1 npm run test:coverage >/dev/null 2>&1; node -e "
const s = require('./coverage/coverage-summary.json');
const key = Object.keys(s).find(k => k.includes('server/brands/service.ts'));
if (!key) { console.error('brands/service.ts missing from coverage'); process.exit(1); }
console.log('brands/service.ts covered lines pct:', s[key].lines.pct);
"
```

Expected: prints `brands/service.ts covered lines pct: 0`. If the file is
missing, Vitest's `coverage.all` default has been disabled by something —
add `all: true` explicitly to the coverage block and re-run.

- [ ] **Step 6: Gitignore the output dir**

Check `grep -n "^coverage" .gitignore`; if absent, add a `coverage/` line.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json config/vitest.config.ts .gitignore
git commit -m "test: add vitest v8 coverage reporting (no thresholds)"
```

### Task 2: Coverage in CI + PR

**Files:**
- Modify: `.github/workflows/unit-tests.yml`

**Interfaces:**
- Consumes: `npm run test:coverage` from Task 1.
- Produces: unit-tests CI job prints the coverage summary into the GitHub job summary and uploads the HTML report artifact `coverage-report`.

- [ ] **Step 1: Replace the test step and add summary + artifact steps** in `.github/workflows/unit-tests.yml`

Replace:

```yaml
      - name: Run unit tests
        run: npm run test:unit
```

with:

```yaml
      - name: Run unit tests with coverage
        run: npm run test:coverage

      - name: Append coverage summary to job summary
        if: always()
        run: |
          if [ -f coverage/coverage-summary.json ]; then
            node -e "
            const s = require('./coverage/coverage-summary.json').total;
            const row = (k) => \`| \${k} | \${s[k].pct}% (\${s[k].covered}/\${s[k].total}) |\`;
            console.log('## Unit coverage (src/server, src/lib, src/hooks)');
            console.log('| metric | value |'); console.log('| --- | --- |');
            for (const k of ['lines','statements','functions','branches']) console.log(row(k));
            " >> "$GITHUB_STEP_SUMMARY"
          fi

      - name: Upload coverage HTML report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 14
```

- [ ] **Step 2: Sanity-check the workflow parses**

Run: `node -e "const yaml=require('js-yaml');yaml.load(require('fs').readFileSync('.github/workflows/unit-tests.yml','utf8'));console.log('ok')"`
(js-yaml ships transitively; if the require fails, eyeball the diff instead.)
Expected: `ok`

- [ ] **Step 3: Commit and open the PR**

```bash
git add .github/workflows/unit-tests.yml
git commit -m "ci: report unit coverage summary + artifact on every PR"
npm run pr:create
```

Expected: e2e suite passes locally, PR opens against `development`. On the
PR's CI run, verify the job summary shows the coverage table and the
`coverage-report` artifact exists. **Record the baseline totals in the PR
description — they order the Phase 3 plan.**

---

## Phase 2 — E2E read sweep

### Task 3: Route manifest + parity guard (PR 2, branch `test/p2-sweep-core`)

**Files:**
- Create: `tests/playwright/utils/route-manifest.ts`
- Create: `tests/unit/route-sweep-parity.test.ts`

**Interfaces:**
- Produces (consumed by every later Phase 2 task):
  - `type Marker = { role: "heading" | "link" | "button"; name: string | RegExp } | { text: string | RegExp } | { testId: string }`
  - `type RouteEntry = { path: string; pattern: string; marker: Marker; spec: SweepSpec; auth?: boolean }` where `type SweepSpec = "core" | "static" | "community" | "tools" | "auth-gated" | "admin"`
  - `const routeManifest: RouteEntry[]`
  - `const skippedRoutes: Record<string, string>` (pattern → reason)
  - `function routesForSpec(spec: SweepSpec): RouteEntry[]`

- [ ] **Step 1: Create the branch**

```bash
git checkout development && git pull && git checkout -b test/p2-sweep-core
```

- [ ] **Step 2: Write the failing parity test** at `tests/unit/route-sweep-parity.test.ts`

```ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  routeManifest,
  skippedRoutes,
} from "../playwright/utils/route-manifest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(testDir, "../../src/app");

/** Derive route patterns from the filesystem, mirroring Next's conventions. */
function routePatternsFromFilesystem(): string[] {
  const pages = fs
    .readdirSync(appDir, { recursive: true, encoding: "utf8" })
    .filter((p) => path.basename(p) === "page.tsx");

  const patterns = new Set<string>();
  for (const page of pages) {
    const rawSegments = path.dirname(page).split(path.sep);
    // Interception routes ((.)edit etc.) duplicate their target route —
    // the sweep tests the target, so drop the whole page.
    if (rawSegments.some((seg) => /^\(\.{1,3}\)/.test(seg))) continue;
    const segments = rawSegments.filter(
      (seg) =>
        seg !== "." &&
        !(seg.startsWith("(") && seg.endsWith(")")) && // route groups
        !seg.startsWith("@"), // parallel route slots
    );
    if (segments[0] === "[locale]") segments.shift();
    patterns.add(segments.length === 0 ? "/" : `/${segments.join("/")}`);
  }
  return [...patterns].sort();
}

describe("route sweep parity", () => {
  it("every app route is in the sweep manifest or explicitly skipped", () => {
    const covered = new Set(routeManifest.map((r) => r.pattern));
    const unaccounted = routePatternsFromFilesystem().filter(
      (p) => !covered.has(p) && !(p in skippedRoutes),
    );
    expect(
      unaccounted,
      "New routes must be added to tests/playwright/utils/route-manifest.ts (or its skip list, with a reason)",
    ).toEqual([]);
  });

  it("manifest and skip list reference only live routes, without overlap", () => {
    const live = new Set(routePatternsFromFilesystem());
    for (const r of routeManifest) {
      expect(live.has(r.pattern), `manifest references removed route ${r.pattern}`).toBe(true);
      expect(r.pattern in skippedRoutes, `${r.pattern} is both swept and skipped`).toBe(false);
    }
    for (const p of Object.keys(skippedRoutes)) {
      expect(live.has(p), `skip list references removed route ${p}`).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm run test:unit -- tests/unit/route-sweep-parity.test.ts`
Expected: FAIL — cannot resolve `../playwright/utils/route-manifest`.

- [ ] **Step 4: Create `tests/playwright/utils/route-manifest.ts`**

No `@playwright/test` import — pure data, shared with Vitest. Start with the
routes PR 2 can render (existing seed only); everything else goes to the
skip list with a `fixture pending` reason and migrates in later tasks.

```ts
/**
 * Single source of truth for the e2e read sweep. Spec files iterate
 * routesForSpec(); tests/unit/route-sweep-parity.test.ts diffs patterns
 * against src/app. New page => add an entry here (or a skip with a reason).
 */
export type Marker =
  | { role: "heading" | "link" | "button"; name: string | RegExp }
  | { text: string | RegExp }
  | { testId: string };

export type SweepSpec =
  | "core"
  | "static"
  | "community"
  | "tools"
  | "auth-gated"
  | "admin";

export type RouteEntry = {
  /** Concrete path to visit (fixture params filled in), e.g. "/gear/nikon-z6iii" */
  path: string;
  /** Filesystem-derived pattern, e.g. "/gear/[slug]" — parity-guard key */
  pattern: string;
  /** Proof the page rendered its data; resolved in expect-page-renders.ts */
  marker: Marker;
  spec: SweepSpec;
  /** Needs the signed-in storage state (added in the auth task) */
  auth?: boolean;
};

const GEAR = { slug: "nikon-z6iii", name: "Nikon Z6III" } as const;
const NEWS_TITLE = "Sharply E2E seed news post";

export const routeManifest: RouteEntry[] = [
  // --- core ---
  { path: "/", pattern: "/", marker: { role: "heading", name: "Photography gear made simple." }, spec: "core" },
  { path: "/gear", pattern: "/gear", marker: { text: GEAR.name }, spec: "core" },
  { path: `/gear/${GEAR.slug}`, pattern: "/gear/[slug]", marker: { role: "heading", name: GEAR.name }, spec: "core" },
  { path: "/browse", pattern: "/browse/[[...segments]]", marker: { role: "heading", name: "All Gear" }, spec: "core" },
  { path: "/search?q=z6", pattern: "/search", marker: { text: GEAR.name }, spec: "core" },
  { path: "/brand/nikon", pattern: "/brand/[slug]", marker: { text: GEAR.name }, spec: "core" },
  // --- static ---
  { path: "/about", pattern: "/about", marker: { role: "heading", name: "Photography for Everyone" }, spec: "static" },
  // (privacy-policy, terms-of-service, developer, developer/docs, discord/*,
  //  auth/signin, edit-success, gear/[slug]/submitted, learn/basics are added
  //  in Task 5 Step 3 with markers pulled from messages/en.json.)
  // --- community (existing seed) ---
  { path: "/news", pattern: "/news", marker: { text: NEWS_TITLE }, spec: "community" },
  { path: "/news/sharply-e2e-seed-news-post", pattern: "/news/[slug]", marker: { role: "heading", name: NEWS_TITLE }, spec: "community" },
  { path: "/lists/trending", pattern: "/lists/trending", marker: { text: GEAR.name }, spec: "community" },
];

/** pattern -> reason. Permanent skips keep their reason; "fixture pending"
 *  entries migrate into routeManifest in Tasks 5-8. */
export const skippedRoutes: Record<string, string> = {
  "/cms/[[...segments]]": "Payload's own admin UI — not ours to sweep",
  "/ui-demo": "dev-only component gallery",
  "/construction-test": "dev-only page",
  "/auth/verify-otp": "renders only mid-auth-flow; redirects covered by routing-auth.spec",
  "/auth/welcome": "renders only mid-auth-flow post-signup",
  // fixture pending — migrate in later Phase 2 tasks:
  "/reviews": "fixture pending (Task 6: payload review)",
  "/reviews/[slug]": "fixture pending (Task 6: payload review)",
  "/learn": "fixture pending (Task 6: payload learn page)",
  "/learn/[slug]": "fixture pending (Task 6: payload learn page)",
  "/learn/basics": "fixture pending (Task 5: static markers)",
  "/tags": "fixture pending (Task 5: tag row)",
  "/tags/[slug]": "fixture pending (Task 5: tag row)",
  "/u/[handle]": "fixture pending (Task 5: user handle)",
  "/list/[shared]": "fixture pending (Task 5: shared list)",
  "/invite": "fixture pending (Task 5: static markers)",
  "/invite/[id]": "fixture pending (Task 5: invite row)",
  "/recommended-lenses": "fixture pending (Task 5: recommendation chart)",
  "/recommended-lenses/[brand]/[slug]": "fixture pending (Task 5: recommendation chart)",
  "/lists/hall-of-fame": "fixture pending (Task 5: empty-state marker triage)",
  "/lists/under-construction": "fixture pending (Task 5: marker triage)",
  "/privacy-policy": "fixture pending (Task 5: static markers)",
  "/terms-of-service": "fixture pending (Task 5: static markers)",
  "/developer": "fixture pending (Task 5: static markers)",
  "/developer/docs": "fixture pending (Task 5: static markers)",
  "/discord/bingo": "fixture pending (Task 5: static markers)",
  "/discord/bot-commands": "fixture pending (Task 5: static markers)",
  "/auth/signin": "fixture pending (Task 5: static markers)",
  "/edit-success": "fixture pending (Task 5: static markers)",
  "/gear/[slug]/submitted": "fixture pending (Task 5: static markers)",
  "/contact": "fixture pending (Task 5: static markers)",
  "/compare": "fixture pending (Task 7: tools markers)",
  "/exif-viewer": "fixture pending (Task 7: tools markers)",
  "/focal-length-reference": "fixture pending (Task 7: tools markers)",
  "/focal-simulator": "fixture pending (Task 7: tools markers)",
  "/instagram-post-builder": "fixture pending (Task 7: tools markers)",
  "/profile": "fixture pending (Task 8: auth)",
  "/profile/settings": "fixture pending (Task 8: auth)",
  "/profile/settings/add-passkey": "fixture pending (Task 8: auth)",
  "/gear/[slug]/edit": "fixture pending (Task 8: auth)",
  "/contribute/random": "fixture pending (Task 8: auth triage)",
  "/admin": "fixture pending (Task 8: admin auth)",
  "/admin/analytics": "fixture pending (Task 8: admin auth)",
  "/admin/approved-creators": "fixture pending (Task 8: admin auth)",
  "/admin/bulk-create": "fixture pending (Task 8: admin auth)",
  "/admin/developer-api": "fixture pending (Task 8: admin auth)",
  "/admin/gear": "fixture pending (Task 8: admin auth)",
  "/admin/help": "fixture pending (Task 8: admin auth)",
  "/admin/leaderboard": "fixture pending (Task 8: admin auth)",
  "/admin/logs": "fixture pending (Task 8: admin auth)",
  "/admin/private": "fixture pending (Task 8: admin auth)",
  "/admin/tags": "fixture pending (Task 8: admin auth)",
  "/admin/tools": "fixture pending (Task 8: admin auth)",
  "/admin/recommended-lenses": "fixture pending (Task 8: admin auth)",
  "/admin/recommended-lenses/[brand]/[slug]": "fixture pending (Task 8: admin auth)",
  "/admin/recommended-lenses/new": "fixture pending (Task 8: admin auth)",
};

export function routesForSpec(spec: SweepSpec): RouteEntry[] {
  return routeManifest.filter((route) => route.spec === spec);
}
```

- [ ] **Step 5: Run the parity test until it passes**

Run: `npm run test:unit -- tests/unit/route-sweep-parity.test.ts`
Expected: FAIL listing any filesystem pattern the manifest+skip list missed,
or naming a stale pattern (e.g. if a skip-list key doesn't match the derived
pattern exactly). Fix the manifest/skip list — never the derivation — until
PASS. The failure list is the exact set of strings to use.

- [ ] **Step 6: Full unit suite still green**

Run: `npm run test:unit`
Expected: PASS (no other test collides).

- [ ] **Step 7: Commit**

```bash
git add tests/unit/route-sweep-parity.test.ts tests/playwright/utils/route-manifest.ts
git commit -m "test: add route manifest + parity guard for the e2e page sweep"
```

### Task 4: Render helper + first sweep specs + PR

**Files:**
- Create: `tests/playwright/utils/expect-page-renders.ts`
- Create: `tests/playwright/pages/core.spec.ts`
- Create: `tests/playwright/pages/static.spec.ts`
- Create: `tests/playwright/pages/community.spec.ts`

**Interfaces:**
- Consumes: `routesForSpec`, `RouteEntry`, `Marker` from Task 3.
- Produces: `expectPageRenders(page: Page, route: RouteEntry): Promise<void>` — the assertion contract for every sweep spec.

- [ ] **Step 1: Write `tests/playwright/utils/expect-page-renders.ts`**

```ts
import { expect, type Page } from "@playwright/test";

import type { Marker, RouteEntry } from "./route-manifest";

// messages/en.json -> error.genericTitle; rendered by src/app/[locale]/error.tsx
const ERROR_BOUNDARY_TEXT = "Something went wrong!";

function resolveMarker(page: Page, marker: Marker) {
  if ("role" in marker) return page.getByRole(marker.role, { name: marker.name });
  if ("testId" in marker) return page.getByTestId(marker.testId);
  return page.getByText(marker.text);
}

/**
 * The sweep's assertion contract (spec §Phase 2):
 * 1. marker visible — primary; proves routing -> service -> data ran
 * 2. error boundary absent — a late streamed error still fails the test
 * 3. response.ok() — secondary; streaming SSR sends 200 before late errors
 * Browser-side third-party requests are blocked (CI has dummy keys; the
 * sweep must not flake on unreachable hosts). Server-side external calls
 * can't be intercepted here — they already run against dummy keys in CI.
 */
export async function expectPageRenders(page: Page, route: RouteEntry) {
  await page.route(
    (url) => !["localhost", "127.0.0.1"].includes(url.hostname),
    (r) => r.abort(),
  );

  const response = await page.goto(route.path);

  await expect(
    resolveMarker(page, route.marker).first(),
    `marker missing on ${route.path}`,
  ).toBeVisible();
  await expect(
    page.getByText(ERROR_BOUNDARY_TEXT),
    `error boundary rendered on ${route.path}`,
  ).toHaveCount(0);
  expect(
    response?.ok(),
    `non-OK status on ${route.path}: ${response?.status()}`,
  ).toBe(true);
}
```

- [ ] **Step 2: Write the three spec files** — identical shape, different spec key. `tests/playwright/pages/core.spec.ts`:

```ts
import { test } from "@playwright/test";

import { expectPageRenders } from "../utils/expect-page-renders";
import { routesForSpec } from "../utils/route-manifest";

for (const route of routesForSpec("core")) {
  test(`renders ${route.path}`, async ({ page }) => {
    await expectPageRenders(page, route);
  });
}
```

`static.spec.ts` and `community.spec.ts`: same file with `"static"` /
`"community"`. (Repeat the code — do not build an abstraction over three
five-line files.)

- [ ] **Step 3: Run the sweep against the local e2e stack**

```bash
npm run e2e:setup-local
npm run test:e2e -- tests/playwright/pages
```

Expected: all core/static/community entries pass. Debug notes:
- `/brand/nikon` 404 → the brand slug differs; check `node -e "require('./src/lib/generated')"` or `grep -n '"nikon"' src/lib/generated/*.ts | head` and fix the manifest path.
- `/search?q=z6` marker missing → pg_trgm extension missing on a stale local DB (`docker rm -f sharply-e2e-postgres` and re-run setup-local).
- Marker text mismatches → adjust the manifest entry to what actually renders; the marker must stay data-driven (a seeded value, not a static heading) for data-backed pages.

- [ ] **Step 4: Full existing e2e suite still green**

Run: `npm run test:e2e`
Expected: PASS — the new pages/ specs coexist with basic/ specs.

- [ ] **Step 5: Commit and open the PR**

```bash
git add tests/playwright/utils/expect-page-renders.ts tests/playwright/pages
git commit -m "test: add e2e read-sweep helper and first page specs"
npm run pr:create
```

### Task 5: E2E DB fixtures + static markers (PR 3, branch `test/p2-sweep-fixtures`)

**Files:**
- Create: `scripts/e2e/seed-fixtures.ts`
- Modify: `package.json` (script `e2e:seed-fixtures`)
- Modify: `scripts/e2e/setup-local.sh` (run it after `db:seed`)
- Modify: `.github/workflows/e2e-tests.yml` (run it after `Seed database`)
- Modify: `tests/playwright/utils/route-manifest.ts` (migrate skips → entries)

**Interfaces:**
- Consumes: manifest/skip-list from Task 3; drizzle schema tables.
- Produces: deterministic DB fixtures — dev user `dev@sharply.local` (role `SUPERADMIN`, handle `sharply-dev`), tag `e2e-seed-collection`, shared list at `/list/e2e-shared-list-e2eseedpub1`, invite id `e2e-invite-fixture-0001`, recommendation chart `nikon`/`e2e-seed-chart`. Later tasks rely on these exact values.

- [ ] **Step 1: Create the branch**

```bash
git checkout development && git pull && git checkout -b test/p2-sweep-fixtures
```

- [ ] **Step 2: Write `scripts/e2e/seed-fixtures.ts`**

Import style mirrors `scripts/seed.ts` (relative `../src/...` imports, `import "dotenv/config"` first). Idempotent: every insert is select-first or `onConflictDoNothing`.

```ts
/**
 * E2E-only DB fixtures for the Playwright read sweep. Runs AFTER db:seed in
 * the e2e pipeline (CI + setup-local). Never run against dev/prod databases.
 * Values are consumed by tests/playwright/utils/route-manifest.ts — keep in sync.
 */
import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "../../src/server/db";
import {
  gearTags,
  invites,
  recommendationCharts,
  recommendationItems,
  sharedLists,
  tags,
  userListItems,
  userLists,
  users,
} from "../../src/server/db/schema";

const Z6III_ID = "ec11113e-ae24-44cb-871f-4eb763d2d378"; // scripts/seed.ts liveZ6iii

async function ensureDevUser() {
  const existing = await db.select().from(users).where(eq(users.email, "dev@sharply.local")).limit(1);
  if (existing[0]) {
    const [updated] = await db
      .update(users)
      .set({ role: "SUPERADMIN", handle: "sharply-dev", name: "Sharply Dev User" })
      .where(eq(users.id, existing[0].id))
      .returning();
    return updated ?? existing[0];
  }
  const [created] = await db
    .insert(users)
    .values({
      name: "Sharply Dev User",
      email: "dev@sharply.local",
      role: "SUPERADMIN",
      handle: "sharply-dev",
    })
    .returning();
  return created!;
}

async function ensureTag() {
  const [tag] = await db
    .insert(tags)
    .values({
      name: "E2E Seed Collection",
      slug: "e2e-seed-collection",
      description: "Deterministic tag for the e2e read sweep.",
    })
    .onConflictDoNothing({ target: tags.slug })
    .returning();
  const record =
    tag ?? (await db.select().from(tags).where(eq(tags.slug, "e2e-seed-collection")).limit(1))[0]!;
  await db
    .insert(gearTags)
    .values({ gearId: Z6III_ID, tagId: record.id })
    .onConflictDoNothing();
}

async function ensureSharedList(userId: string) {
  const existing = await db
    .select()
    .from(sharedLists)
    .where(eq(sharedLists.publicId, "e2eseedpub1"))
    .limit(1);
  if (existing[0]) return;
  const [list] = await db
    .insert(userLists)
    .values({ userId, name: "E2E Shared List" })
    .returning();
  await db.insert(userListItems).values({ listId: list!.id, gearId: Z6III_ID });
  await db.insert(sharedLists).values({
    listId: list!.id,
    slug: "e2e-shared-list",
    publicId: "e2eseedpub1",
    isPublished: true,
  });
}

async function ensureInvite(createdById: string) {
  await db
    .insert(invites)
    .values({
      id: "e2e-invite-fixture-0001",
      inviteeName: "E2E Invitee",
      createdById,
    })
    .onConflictDoNothing({ target: invites.id });
}

async function ensureRecommendationChart() {
  const existing = await db
    .select()
    .from(recommendationCharts)
    .where(eq(recommendationCharts.slug, "e2e-seed-chart"))
    .limit(1);
  if (existing[0]) return;
  const [chart] = await db
    .insert(recommendationCharts)
    .values({
      brand: "nikon",
      slug: "e2e-seed-chart",
      title: "E2E Seed Nikon Chart",
      updatedDate: "2026-08-31",
      isPublished: true,
    })
    .returning();
  await db.insert(recommendationItems).values({
    chartId: chart!.id,
    gearId: Z6III_ID,
    rating: "balanced", // recommendationRatingEnum, schema.ts:336
  });
}

async function main() {
  const devUser = await ensureDevUser();
  await ensureTag();
  await ensureSharedList(devUser.id);
  await ensureInvite(devUser.id);
  await ensureRecommendationChart();
  console.log("[e2e:seed-fixtures] fixtures ensured");
  process.exit(0);
}

main().catch((error) => {
  console.error("[e2e:seed-fixtures] failed", error);
  process.exit(1);
});
```

Before running: if `updatedDate`'s `dateCol` rejects the string, check the
helper's definition in `schema.ts` and pass `new Date("2026-08-31")`
instead. If a typecheck error names other required columns, read that
table's block in `schema.ts` and supply minimal values — do not guess. If
`/invite/e2e-invite-fixture-0001` later 404s because `fetchInviteById`
validates UUID format, switch the fixture id to
`"e2ee2ee2-e2ee-4e2e-8e2e-e2ee2ee2e2e1"` and update the manifest path to
match.

- [ ] **Step 3: Wire it into both pipelines**

`package.json`:

```json
"e2e:seed-fixtures": "tsx scripts/e2e/seed-fixtures.ts",
```

`scripts/e2e/setup-local.sh` — after the `npm run db:seed -- --confirm-seed` line:

```bash
npm run e2e:seed-fixtures
```

`.github/workflows/e2e-tests.yml` — after the `Seed database` step:

```yaml
      - name: Seed e2e fixtures
        run: npm run e2e:seed-fixtures
```

- [ ] **Step 4: Run it against the local stack and verify**

```bash
npm run e2e:setup-local
```

Expected: ends with `[e2e:seed-fixtures] fixtures ensured`. Run it twice —
second run must also succeed (idempotency).

- [ ] **Step 5: Migrate the DB-fixture skips into manifest entries**

In `route-manifest.ts`, delete these skip-list lines and add entries (all in
existing spec buckets — `community` unless noted):

```ts
  { path: "/tags", pattern: "/tags", marker: { text: "E2E Seed Collection" }, spec: "community" },
  { path: "/tags/e2e-seed-collection", pattern: "/tags/[slug]", marker: { text: GEAR.name }, spec: "community" },
  { path: "/u/sharply-dev", pattern: "/u/[handle]", marker: { text: "Sharply Dev User" }, spec: "community" },
  { path: "/list/e2e-shared-list-e2eseedpub1", pattern: "/list/[shared]", marker: { text: GEAR.name }, spec: "community" },
  { path: "/invite/e2e-invite-fixture-0001", pattern: "/invite/[id]", marker: { text: "E2E Invitee" }, spec: "community" },
  { path: "/recommended-lenses", pattern: "/recommended-lenses", marker: { text: "E2E Seed Nikon Chart" }, spec: "community" },
  { path: "/recommended-lenses/nikon/e2e-seed-chart", pattern: "/recommended-lenses/[brand]/[slug]", marker: { role: "heading", name: "E2E Seed Nikon Chart" }, spec: "community" },
```

- [ ] **Step 6: Migrate the static-marker skips**

For each remaining `Task 5: static markers` skip (`/privacy-policy`,
`/terms-of-service`, `/developer`, `/developer/docs`, `/discord/bingo`,
`/discord/bot-commands`, `/auth/signin`, `/edit-success`,
`/gear/[slug]/submitted`, `/learn/basics`, `/invite`, `/contact`,
`/lists/hall-of-fame`, `/lists/under-construction`): visit the page on the
running local stack (`npm run dev:e2e`, or curl and read the HTML), pick the
page's h1/main heading as the marker, and add a `spec: "static"` entry
(`/lists/*`: `spec: "community"`; use the page heading — these render
empty-state without HOF/construction seed data, which is fine, note it in
the entry with a trailing comment). `/gear/[slug]/submitted` uses
`path: "/gear/nikon-z6iii/submitted"`. Marker strings must be copied from
the rendered page, not invented; for translated pages cross-check
`messages/en.json`.

- [ ] **Step 7: Parity + sweep green**

```bash
npm run test:unit -- tests/unit/route-sweep-parity.test.ts
npm run test:e2e -- tests/playwright/pages
```

Expected: both PASS. Any marker that doesn't match reality gets fixed in the
manifest (visit the page; copy what renders).

- [ ] **Step 8: Commit**

```bash
git add scripts/e2e/seed-fixtures.ts package.json scripts/e2e/setup-local.sh .github/workflows/e2e-tests.yml tests/playwright/utils/route-manifest.ts
git commit -m "test: e2e DB fixtures + fixture-backed and static sweep routes"
```

### Task 6: Payload fixtures (learn page + review)

**Files:**
- Modify: `scripts/e2e/bootstrap-payload.ts`
- Modify: `tests/playwright/utils/route-manifest.ts`

**Interfaces:**
- Consumes: Payload Local API pattern already in the bootstrap (see the news-post block — copy its shape, including the lexical `content` root).
- Produces: published learn page (title `Sharply E2E seed learn page` → slug `sharply-e2e-seed-learn-page`), published review (title `Sharply E2E seed review` → slug `sharply-e2e-seed-review`).

- [ ] **Step 1: Extend the bootstrap** — after the news-post creation in `scripts/e2e/bootstrap-payload.ts`, reusing the already-created `media` doc and the same lexical content structure (extract the news post's `content` object into a `lexicalParagraph(text: string)` helper first):

```ts
  await payload.create({
    collection: "learn-pages",
    draft: false,
    data: {
      title: "Sharply E2E seed learn page",
      thumbnail: media.id,
      _status: "published",
      category: "basics", // real category => also gives /learn/basics data
      skill_level: "beginner",
      content: lexicalParagraph("Deterministic learn content for the e2e sweep."),
      command_aliases: [{ alias: "e2e-seed" }],
    },
  });

  await payload.create({
    collection: "review",
    draft: false,
    data: {
      title: "Sharply E2E seed review",
      thumbnail: media.id,
      _status: "published",
      review_summary: "Deterministic review summary for the e2e sweep.",
      goodPoints: [{ goodNote: "Renders deterministically" }],
      badPoints: [{ badNote: "Exists only for tests" }],
      reviewContent: lexicalParagraph("Deterministic review content for the e2e sweep."),
    },
  });
```

Run the bootstrap; if Payload rejects with a named missing/invalid field,
open the collection file (`src/collections/LearnPages.ts` /
`src/collections/Review.ts`), read that field's definition, and supply a
minimal valid value. Repeat until it creates cleanly. Also make the existing idempotency check cover the new
docs (check each collection for its seed title, not just news).

- [ ] **Step 2: Rebuild fixtures and verify**

```bash
npm run e2e:setup-local
```

Expected: bootstrap logs creation of media + news + learn + review; running
it twice stays clean.

- [ ] **Step 3: Migrate the four skips into entries**

```ts
  { path: "/learn", pattern: "/learn", marker: { text: "Sharply E2E seed learn page" }, spec: "community" },
  { path: "/learn/sharply-e2e-seed-learn-page", pattern: "/learn/[slug]", marker: { role: "heading", name: "Sharply E2E seed learn page" }, spec: "community" },
  { path: "/reviews", pattern: "/reviews", marker: { text: "Sharply E2E seed review" }, spec: "community" },
  { path: "/reviews/sharply-e2e-seed-review", pattern: "/reviews/[slug]", marker: { role: "heading", name: "Sharply E2E seed review" }, spec: "community" },
```

If the review/learn slug differs (Payload slugify config), read the actual
slug from the bootstrap output or the running page and correct the paths.

- [ ] **Step 4: Parity + sweep green**

```bash
npm run test:unit -- tests/unit/route-sweep-parity.test.ts
npm run test:e2e -- tests/playwright/pages
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/e2e/bootstrap-payload.ts tests/playwright/utils/route-manifest.ts
git commit -m "test: payload learn/review fixtures + their sweep routes"
```

### Task 7: Tools specs + PR

**Files:**
- Create: `tests/playwright/pages/tools.spec.ts`
- Modify: `tests/playwright/utils/route-manifest.ts`

**Interfaces:**
- Consumes: `routesForSpec("tools")`, `expectPageRenders`.

- [ ] **Step 1: Migrate the five tools skips** into `spec: "tools"` entries. These are client-heavy static tools — visit each on the local stack and copy its main heading as the marker (same procedure as Task 5 Step 6): `/compare`, `/exif-viewer`, `/focal-length-reference`, `/focal-simulator`, `/instagram-post-builder`.

- [ ] **Step 2: Create `tests/playwright/pages/tools.spec.ts`** — same five-line shape as core.spec.ts with `routesForSpec("tools")`:

```ts
import { test } from "@playwright/test";

import { expectPageRenders } from "../utils/expect-page-renders";
import { routesForSpec } from "../utils/route-manifest";

for (const route of routesForSpec("tools")) {
  test(`renders ${route.path}`, async ({ page }) => {
    await expectPageRenders(page, route);
  });
}
```

- [ ] **Step 3: Parity + full e2e green, then PR**

```bash
npm run test:unit -- tests/unit/route-sweep-parity.test.ts
npm run test:e2e
git add tests/playwright/pages/tools.spec.ts tests/playwright/utils/route-manifest.ts
git commit -m "test: tools page sweep specs"
npm run pr:create
```

### Task 8: Auth storage state + auth-gated/admin specs (PR 4, branch `test/p2-sweep-auth`)

**Files:**
- Create: `tests/playwright/auth.setup.ts`
- Create: `tests/playwright/pages/auth-gated.spec.ts`
- Create: `tests/playwright/pages/admin.spec.ts`
- Modify: `config/playwright.config.ts` (setup project + dependencies)
- Modify: `package.json` (`dev:e2e` gains `DEV_AUTH=true`)
- Modify: `tests/playwright/utils/route-manifest.ts`

**Interfaces:**
- Consumes: dev-login bypass (`/api/dev-login`; identity fixed per-process — `dev@sharply.local`, seeded `SUPERADMIN` by Task 5, so one storage state covers user+admin routes).
- Produces: `tests/playwright/utils/auth.ts` exporting `STORAGE_STATE_PATH`; a `setup` Playwright project all browser projects depend on.

- [ ] **Step 1: Create the branch**

```bash
git checkout development && git pull && git checkout -b test/p2-sweep-auth
```

- [ ] **Step 2: `dev:e2e` must enable the bypass** — in `package.json`:

```json
"dev:e2e": "DEV_AUTH=true SKIP_ENV_VALIDATION=1 next dev --turbo -H 127.0.0.1 -p 3000",
```

(`start:e2e` already sets it; this covers the local dev-server path. The
bypass stays localhost-only and fail-closed in production — see
`src/server/auth/dev-auth/service.ts`.)

- [ ] **Step 3: Create `tests/playwright/utils/auth.ts` and `tests/playwright/auth.setup.ts`**

```ts
// tests/playwright/utils/auth.ts
import path from "node:path";
import { fileURLToPath } from "node:url";

const utilsDir = path.dirname(fileURLToPath(import.meta.url));
export const STORAGE_STATE_PATH = path.resolve(
  utilsDir,
  "../../../test-results/.auth/dev-user.json",
);
```

```ts
// tests/playwright/auth.setup.ts
import { expect, test as setup } from "@playwright/test";

import { STORAGE_STATE_PATH } from "./utils/auth";

setup("authenticate via dev-login bypass", async ({ page }) => {
  // Mints a session for dev@sharply.local (SUPERADMIN via e2e fixtures)
  // and redirects home. Requires DEV_AUTH=true on the server.
  await page.goto("/api/dev-login");
  await expect(page).toHaveURL(/\/$/);
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
```

- [ ] **Step 4: Wire the setup project into `config/playwright.config.ts`**

The `projects` arrays become: a `setup` project first, and every browser
project depends on it:

```ts
const setupProject = {
  name: "setup",
  testMatch: /auth\.setup\.ts/,
};

const withSetup = (browserProjects: typeof projects) => [
  setupProject,
  ...browserProjects.map((p) => ({ ...p, dependencies: ["setup"] })),
];
```

Apply `withSetup(...)` to both the full-matrix and chromium-only arrays.
(The storage-state cookies from the chromium setup run work in every
browser project — it's a JSON cookie file, not a browser profile.)

- [ ] **Step 5: Create the two specs — they opt into the storage state**

```ts
// tests/playwright/pages/auth-gated.spec.ts
import { test } from "@playwright/test";

import { expectPageRenders } from "../utils/expect-page-renders";
import { STORAGE_STATE_PATH } from "../utils/auth";
import { routesForSpec } from "../utils/route-manifest";

test.use({ storageState: STORAGE_STATE_PATH });

for (const route of routesForSpec("auth-gated")) {
  test(`renders ${route.path}`, async ({ page }) => {
    await expectPageRenders(page, route);
  });
}
```

`admin.spec.ts`: identical with `routesForSpec("admin")`.

- [ ] **Step 6: Migrate the auth and admin skips into entries** (all `auth: true`)

`auth-gated` bucket — `/profile`, `/profile/settings`,
`/profile/settings/add-passkey`, `/gear/[slug]/edit`
(path `/gear/nikon-z6iii/edit`), `/contribute/random`. Markers: visit each
signed in (run `npm run dev:e2e`, hit `/api/dev-login` in the browser,
then the page) and copy the main heading; for `/profile` use
`{ text: "Sharply Dev User" }` (data-driven). `/contribute/random`
redirects to a random under-construction gear page — if its landing content
is nondeterministic, assert the redirect target pattern instead: give it
marker `{ role: "heading", name: /.+/ }` plus a trailing comment, or move it
to the skip list with reason `nondeterministic redirect target — landing
covered by /gear/[slug] sweep` if it proves flaky. Either resolution is
acceptable; a reasoned skip beats a flaky spec.

`admin` bucket — all 15 `/admin/...` patterns. Admin pages are hardcoded
English (AGENTS.md): visit each signed in and copy its h1. For
`/admin/recommended-lenses/[brand]/[slug]` use
`path: "/admin/recommended-lenses/nikon/e2e-seed-chart"` (Task 5 fixture).

- [ ] **Step 7: Parity + sweep green, then PR**

```bash
npm run test:unit -- tests/unit/route-sweep-parity.test.ts
npm run e2e:setup-local && npm run test:e2e
git add config/playwright.config.ts package.json tests/playwright
git commit -m "test: auth storage state + auth-gated/admin page sweep"
npm run pr:create
```

Expected: full suite green including the two authed specs.

### Task 9: Locale spec + docs + flip plan (same PR 4 branch, or PR 5 if PR 4 already merged)

**Files:**
- Create: `tests/playwright/pages/locale.spec.ts`
- Modify: `docs/e2e-testing.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Write `tests/playwright/pages/locale.spec.ts`** — one spec guarding i18n plumbing (the sweep itself is en-only by design):

```ts
import { expect, test } from "@playwright/test";

test("a non-default locale renders localized chrome with real data", async ({ page }) => {
  await page.goto("/ja/gear");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  // Gear names are not translated — seeded data proves the data path.
  await expect(page.getByText("Nikon Z6III").first()).toBeVisible();
});
```

Run: `npm run test:e2e -- tests/playwright/pages/locale.spec.ts` — if the
`lang` attribute or the ja path prefix behaves differently (check
`src/i18n` routing config), adjust to what the router actually does; the
assertion pair (locale marker + seeded data) is the contract.

- [ ] **Step 2: Update `docs/e2e-testing.md`** — add a "Page sweep" section documenting: the manifest (`tests/playwright/utils/route-manifest.ts`) as single source of truth; the parity guard (`tests/unit/route-sweep-parity.test.ts`) and what its failure means ("add your new route to the manifest or skip it with a reason"); the assertion contract (marker primary / error-boundary absent / status secondary; third-party browser requests blocked); fixtures (`scripts/e2e/seed-fixtures.ts` + bootstrap additions) and the rule that manifest values and fixture values must move together; the auth setup project and the single-identity dev-login constraint (upgrade path: gated `email` query param on dev-login — documented, not built).

- [ ] **Step 3: Update `AGENTS.md`** — in "Running tests", add `npm run test:coverage`; in "Task Completion Requirements", add two lines:

```markdown
- New page routes must be added to the e2e page sweep manifest (`tests/playwright/utils/route-manifest.ts`) or its skip list with a reason — enforced by `tests/unit/route-sweep-parity.test.ts`.
- New `src/server/` modules ship unit tests in the same PR (coverage is reported on every PR; don't regrow 0% domains).
```

- [ ] **Step 4: Full check, commit, PR**

```bash
npm run check && npm run test:unit && npm run test:e2e
git add tests/playwright/pages/locale.spec.ts docs/e2e-testing.md AGENTS.md
git commit -m "test: locale sweep spec; docs for sweep + coverage conventions"
npm run pr:create   # (skip if continuing on the PR 4 branch — then just push)
```

- [ ] **Step 5: The advisory→required flip (manual, after merge)**

Not automated. After the sweep PRs merge and ~10 consecutive green
`e2e-tests` runs accumulate on PRs (per the PR #391 rollout plan), the user
flips branch protection: GitHub → Settings → Branches → `development` rule →
add `e2e-tests` to required status checks. Record a reminder in the final PR
description. Flake policy from the spec applies from day one: any sweep spec
that needs a retry on two separate CI runs is quarantined the same day
(`test.fixme` + tracking issue).

---

## Phase 3 — Unit gap-fill

Separate plan, written after PR 1 merges and the baseline coverage map
exists (the spec's cluster ordering is data-dependent on it). Do not start
Phase 3 tasks from this document.
