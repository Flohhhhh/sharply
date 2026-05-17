# Privacy and Cookie Inventory

This document records the current cookie and analytics surface in Sharply so the public legal pages stay aligned with the implementation.

## Current Cookies

### Authentication and account flow

- Better Auth session cookies
  - Purpose: authentication, session continuity, and account security.
  - Source: `src/auth.ts`, Better Auth integration and auth routes.

- `invite_id`
  - Purpose: preserves invite flow continuity between `/invite/:id/accept`, sign-in, and the welcome flow.
  - Scope: short-lived, `httpOnly`.
  - Source: `src/app/[locale]/invite/[id]/accept/route.ts`

### Preferences and interface state

- `NEXT_LOCALE`
  - Purpose: remembers language preference and localized routing behavior.
  - Source: `src/middleware.ts`, `src/components/language-switcher.tsx`

- `sidebar_state`
  - Purpose: remembers the sidebar open/collapsed UI preference.
  - Source: `src/components/ui/sidebar.tsx`

### Limited first-party measurement and deduplication

- `visitorId`
  - Purpose: anonymous per-browser deduplication for popularity view and compare-add measurement.
  - Scope: 3-day TTL.
  - Source: `src/server/popularity/actions.ts`, `src/app/[locale]/(pages)/gear/_components/gear-visit-tracker.tsx`

- `comparePair:<slugA|slugB>`
  - Purpose: short-lived per-browser deduplication for compare-pair counting.
  - Scope: 30-minute TTL.
  - Source: `src/server/popularity/actions.ts`

## Current Analytics Tooling

### Vercel Web Analytics

- Package: `@vercel/analytics`
- Mount point: `src/app/[locale]/layout.tsx`
- Production behavior:
  - pageview analytics are enabled in production
  - Vercel Web Analytics is first-party and cookie-free at the analytics layer
  - Vercel documents that visitor identification is based on a request hash rather than third-party cookies

### Custom Analytics Events

Sharply also sends custom Vercel analytics events to understand feature usage and service performance.

Observed event categories in the codebase:

- authentication interactions
  - `auth_signin_press`
  - `auth_otp_submit`

- gear interactions
  - `wishlist_toggle`
  - `ownership_toggle`
  - `image_request_toggle`
  - `review_submit_attempt`
  - `review_submit_complete`
  - `review_submit_duplicate`
  - `review_cta_click`
  - `gear_edit_submit_attempt`
  - `gear_edit_submit_success`
  - `gear_edit_submit_failure`
  - `gear_edit_submit_complete`
  - `gear_edit_continue`
  - `gear_link_click`

- outbound and community interactions
  - `amazon_redirect`
  - `bhphoto_redirect`
  - `discord_click`

Representative sources:

- `src/app/[locale]/(auth)/auth/signin/client.tsx`
- `src/app/[locale]/(auth)/auth/verify-otp/client.tsx`
- `src/app/[locale]/(pages)/gear/_components/gear-links.tsx`
- `src/app/api/out/amazon/route.ts`
- `src/app/api/out/bh/route.ts`
- `src/server/gear/service.ts`

## Public Claims Supported by the Current Implementation

The public Privacy Policy and Terms of Service can accurately say:

- Sharply uses essential and functional cookies for authentication, security, sign-in continuity, invite flows, language preference, and interface preferences.
- Sharply uses limited first-party measurement cookies for anonymous deduplication of aggregate popularity and compare metrics.
- Sharply uses first-party, privacy-focused analytics in production through Vercel Web Analytics and custom analytics events.
- Sharply does not use advertising trackers, retargeting pixels, cross-site profiling tools, or session-replay tooling.
- Sharply does not use analytics events to build marketing or behavioral profiles.

## Public Claims to Avoid Without Product Changes

Do not claim any of the following unless the implementation changes:

- "only essential cookies are used"
- "no cookies are used except authentication cookies"
- "no measurement cookies are used"
- "no analytics are collected"

Those statements are broader than the current implementation because `visitorId`, `comparePair:*`, `NEXT_LOCALE`, `sidebar_state`, and Vercel analytics/custom events are all present today.
