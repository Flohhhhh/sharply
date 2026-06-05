# Header Dynamic Server Usage Post-Mortem

## Summary

We have repeatedly hit build-time regressions where static or ISR routes became non-prerenderable after seemingly small shared-layout changes.

The recurring pattern was not a bug in a single page. It was a misunderstanding of how Next.js treats:

- request-scoped server APIs like `headers()` and `cookies()`
- client navigation hooks like `useSearchParams()`
- shared layout components that sit above many static routes

This document explains the Next.js behavior behind the failures, why the rollback risk kept recurring, and the method we should use to avoid it in the future.

## The Failure Pattern

Two versions of the same class of problem kept appearing:

1. A shared server component in the page layout started calling `headers()`.
2. A shared client component in the layout tree started calling `useSearchParams()` without being isolated behind `Suspense`.

In both cases, the code looked local to the header or footer, but the impact was global because those components were rendered by the shared `(pages)` layout.

That meant static routes such as browse, gear detail, privacy policy, or Discord docs could fail prerendering even though their page files were otherwise static-safe.

## Why Next.js Does This

### 1. `headers()` and `cookies()` are dynamic server APIs

In the App Router, `headers()` and `cookies()` make rendering request-dependent.

If a shared layout or shared server component reads either of them, Next.js must assume the output depends on the current request. That can opt the route into dynamic rendering or break static prerender expectations for ISR/static routes beneath it.

The important point:

- the page does not need to call `headers()`
- it is enough for any ancestor in the render tree to call it

So a “server-first” header can accidentally contaminate every route that uses the shared layout.

### 2. `useSearchParams()` is a client hook with static rendering constraints

`useSearchParams()` is valid in Client Components, but on statically prerendered pages it must be contained in a `Suspense` boundary.

Without that boundary, Next.js treats the hook as requiring a client-side bailout that is unsafe for static prerendering and fails the build with:

- `useSearchParams() should be wrapped in a suspense boundary`

Again, the page itself may be static. The failure can still come from shared layout chrome like:

- a header search sync helper
- a language switcher in the footer
- any other always-rendered client widget

### 3. Shared layouts amplify mistakes

The App Router makes it easy to think in page-local terms, but rendering rules propagate through the layout tree.

If a shared layout renders:

- a dynamic server component
- or a client component that requires `Suspense`

then every descendant route inherits the consequence.

That is why this issue kept resurfacing as “browse broke again” or “gear broke again” even when the actual change lived in the header or footer.

## Root Cause

The root cause was architectural:

- we mixed route-specific request state into shared layout chrome
- we treated “initial SSR fidelity” as more important than static safety
- we did not consistently isolate request-derived client hooks behind `Suspense`

More concretely, we tried to make shared header/footer UI perfectly aware of:

- current pathname
- query string
- callback URL
- locale routing state

at the server/layout level.

That is exactly the layer where Next.js is most sensitive to static-vs-dynamic boundaries.

## What Actually Works

The stable solution is to split shared layout concerns into two categories.

### Category A: server-safe, cache-safe layout data

This is safe to render in shared layouts and shared server components:

- locale from route params
- translated strings loaded from explicit `locale`
- static nav structure
- localized href templates
- other data that does not depend on the current request headers/cookies/search params

This is what the shared header server component should own.

### Category B: request-derived or navigation-derived state

This should stay in client components:

- current pathname
- current search params
- exact callback URL for the current page
- auth/session state when static safety matters
- notification fetches

This is what the hydrated client header should own.

## Preferred Pattern

For shared layout chrome on static/ISR routes:

1. Build a static-safe shell on the server.
2. Pass explicit `locale` and other cache-safe props from route params.
3. Derive live route state in a client component from `usePathname()`.
4. If `useSearchParams()` is needed, isolate only that subtree behind `Suspense`.
5. Keep request APIs like `headers()` and `cookies()` out of shared layout chrome unless the route is intentionally dynamic.

This gives us:

- correct translations in initial HTML
- safe static prerendering
- client refinement of request-specific details after hydration

## Recommended Tradeoff

When forced to choose, prefer:

- route-correct shell
- static safety
- client refinement after hydration

over:

- exact request-aware SSR in shared layout chrome

In practice that means:

- the header can render the correct compact vs expanded shell from `usePathname()`
- the exact query-string callback URL can be finalized after hydration
- auth-dependent widgets can hydrate client-side

This tradeoff is much safer than pushing request awareness into a shared server component.

## Prevention Rules

### Rule 1: Never add `headers()` or `cookies()` to shared page-layout chrome casually

Before using them in:

- header
- footer
- shared `(pages)` layout components
- global wrappers around many routes

assume they can break prerendering for every descendant route.

If you truly need them, first confirm the affected subtree is intentionally dynamic.

### Rule 2: Treat `useSearchParams()` as Suspense-required in static routes

Any shared client component using `useSearchParams()` should be assumed unsafe unless one of these is true:

- it is rendered only on dynamic routes
- or it is isolated behind a `Suspense` boundary

Do not rely on local dev to catch this consistently. Production static prerender is stricter.

### Rule 3: Keep locale resolution param-driven when possible

If the locale is already encoded in the route, prefer:

- route params
- explicit `locale` props
- `setRequestLocale(locale)`

instead of reconstructing locale state from request headers inside shared layout chrome.

If the segment is finite, also bound it at the route level:

- export `dynamicParams = false` on `src/app/[locale]/layout.tsx`
- return only supported locales from `generateStaticParams()`
- call `notFound()` for invalid locale params instead of silently falling back

That prevents scanner paths like `/load.php` or `/admin.php` from entering the `[locale]` tree and surfacing as static-to-dynamic 500s.

### Rule 4: Shared layout changes require static-route thinking

When editing shared layout components, ask:

1. Does this read request-scoped server state?
2. Does this use navigation/search hooks?
3. Is this rendered on static or ISR routes?
4. If yes, is the dynamic part isolated?

If any answer is unclear, assume there is risk.

### Rule 5: Add source-level guard tests

Behavioral tests are not enough for this class of regression.

We should keep source-level regression tests that assert:

- shared headers/layouts do not call `headers()` or `cookies()`
- `useSearchParams()` consumers in shared chrome are wrapped in `Suspense`
- known ISR pages remain free of request-scoped APIs

These tests are cheap and catch architectural drift early.

## Why Rollbacks Kept Happening

Rollbacks were tempting because the breakage looked route-specific, but the regressions came from shared infrastructure.

Without a clear mental model, the same mistake can reappear in a different place:

- first in the header
- later in the footer
- later in another shared client widget

The real fix is not “remember this one patch.”

The real fix is to keep the boundary clear:

- shared layout shell stays static-safe
- request-derived state stays client-side or route-local
- `useSearchParams()` stays behind `Suspense`

## Practical Review Checklist

Before merging a shared layout/header/footer change, review:

- Does any shared server component import `next/headers`?
- Does any shared server component call `headers()` or `cookies()`?
- Does any shared client component use `useSearchParams()`?
- If yes, is that exact subtree wrapped in `Suspense`?
- Is locale coming from route params instead of request reconstruction?
- Would this component render on static or ISR routes?

If the answer suggests risk, redesign before merging.

## Short Version

The lesson is simple:

- request-aware server code does not belong in shared static layout chrome
- `useSearchParams()` in shared client chrome must be isolated behind `Suspense`
- shared layout components should render a static-safe shell first and hydrate request-specific details later

That is the safest way to avoid another rollback.
