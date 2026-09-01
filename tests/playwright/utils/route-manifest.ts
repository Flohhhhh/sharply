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
  { path: "/browse", pattern: "/browse/[[...segments]]", marker: { role: "heading", name: "All Gear" }, spec: "core" },
  { path: "/search?q=z6", pattern: "/search", marker: { role: "link", name: GEAR.name }, spec: "core" },
  { path: "/brand/nikon", pattern: "/brand/[slug]", marker: { role: "link", name: GEAR.name }, spec: "core" },
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
