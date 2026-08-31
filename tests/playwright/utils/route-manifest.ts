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
  // GearCard splits brand/model into sibling text nodes ("Nikon" / "Z6III"),
  // so a combined getByText(GEAR.name) never matches a single text node on
  // grid pages; the rendered <Link>'s accessible name concatenates them
  // (plus the thumbnail's alt text) with spaces, so role "link" still finds
  // the seeded gear card by GEAR.name as a substring.
  { path: "/gear", pattern: "/gear", marker: { role: "link", name: GEAR.name }, spec: "core" },
  { path: `/gear/${GEAR.slug}`, pattern: "/gear/[slug]", marker: { role: "heading", name: GEAR.name }, spec: "core" },
  // Browse hub lists gear via the same split-node GearCard grid as /gear — see comment above.
  { path: "/browse", pattern: "/browse/[[...segments]]", marker: { role: "link", name: GEAR.name }, spec: "core" },
  { path: "/search?q=z6", pattern: "/search", marker: { role: "link", name: GEAR.name }, spec: "core" },
  { path: "/brand/nikon", pattern: "/brand/[slug]", marker: { role: "link", name: GEAR.name }, spec: "core" },
  // --- static ---
  { path: "/about", pattern: "/about", marker: { role: "heading", name: "Photography for Everyone" }, spec: "static" },
  { path: "/privacy-policy", pattern: "/privacy-policy", marker: { role: "heading", name: "Privacy Policy" }, spec: "static" },
  { path: "/terms-of-service", pattern: "/terms-of-service", marker: { role: "heading", name: "Terms of Service" }, spec: "static" },
  // Unauthenticated visit redirects to the sign-in gate ("Welcome" is the
  // sign-in shell's heading) — that redirect is the genuinely rendered content.
  { path: "/developer", pattern: "/developer", marker: { role: "heading", name: "Welcome" }, spec: "static" },
  { path: "/developer/docs", pattern: "/developer/docs", marker: { role: "heading", name: "Welcome" }, spec: "static" },
  { path: "/discord/bingo", pattern: "/discord/bingo", marker: { role: "heading", name: "Photography Lounge Bingo" }, spec: "static" },
  { path: "/discord/bot-commands", pattern: "/discord/bot-commands", marker: { role: "heading", name: "Discord Bot Commands" }, spec: "static" },
  { path: "/auth/signin", pattern: "/auth/signin", marker: { role: "heading", name: "Welcome" }, spec: "static" },
  // Visited with no ?id= — renders the no-edit-id empty-state branch.
  { path: "/edit-success", pattern: "/edit-success", marker: { role: "heading", name: "Submission received" }, spec: "static" },
  { path: "/gear/nikon-z6iii/submitted", pattern: "/gear/[slug]/submitted", marker: { role: "heading", name: "Thanks for your suggestion!" }, spec: "static" },
  { path: "/learn/basics", pattern: "/learn/basics", marker: { role: "heading", name: "The Basics" }, spec: "static" },
  { path: "/invite", pattern: "/invite", marker: { role: "heading", name: "Welcome" }, spec: "static" },
  { path: "/contact", pattern: "/contact", marker: { role: "heading", name: "Let's talk!" }, spec: "static" },
  // --- community (existing seed) ---
  { path: "/news", pattern: "/news", marker: { text: NEWS_TITLE }, spec: "community" },
  { path: "/news/sharply-e2e-seed-news-post", pattern: "/news/[slug]", marker: { role: "heading", name: NEWS_TITLE }, spec: "community" },
  { path: "/lists/trending", pattern: "/lists/trending", marker: { text: GEAR.name }, spec: "community" },
  // Renders its intro copy without curated hall-of-fame seed data (none is seeded).
  { path: "/lists/hall-of-fame", pattern: "/lists/hall-of-fame", marker: { role: "heading", name: "hall of fame" }, spec: "community" },
  // Renders its intro copy without incomplete-gear seed data (none is seeded).
  { path: "/lists/under-construction", pattern: "/lists/under-construction", marker: { role: "heading", name: "Construction List" }, spec: "community" },
  // --- community (e2e fixtures, scripts/e2e/seed-fixtures.ts) ---
  { path: "/tags", pattern: "/tags", marker: { text: "E2E Seed Collection" }, spec: "community" },
  { path: "/tags/e2e-seed-collection", pattern: "/tags/[slug]", marker: { text: GEAR.name }, spec: "community" },
  { path: "/u/sharply-dev", pattern: "/u/[handle]", marker: { text: "Sharply Dev User" }, spec: "community" },
  // Shared-list gear grid uses the same split-node GearCard as /gear — see comment above.
  { path: "/list/e2e-shared-list-e2eseedpub1", pattern: "/list/[shared]", marker: { role: "link", name: GEAR.name }, spec: "community" },
  { path: "/invite/e2e-invite-fixture-0001", pattern: "/invite/[id]", marker: { text: "E2E Invitee" }, spec: "community" },
  // BrandBrowser (_components/BrandBrowser.tsx) is a client component that only
  // renders a chart's title after its brand filter button is clicked;
  // expectPageRenders never clicks, so the initial-render-visible proof that
  // the fixture chart loaded is its brand filter button ("Nikon"), not the
  // chart title text.
  { path: "/recommended-lenses", pattern: "/recommended-lenses", marker: { role: "button", name: "Nikon" }, spec: "community" },
  { path: "/recommended-lenses/nikon/e2e-seed-chart", pattern: "/recommended-lenses/[brand]/[slug]", marker: { role: "heading", name: "E2E Seed Nikon Chart" }, spec: "community" },
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
