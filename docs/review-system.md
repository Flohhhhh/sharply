## Review System

This document describes the end‑to‑end user review system for gear pages: data model, APIs, UI flows, moderation, and integration points.

### Goals

- One review per user per gear
- Minimal, structured inputs (use cases + recommendation + freeform text)
- Fast write with automatic moderation pass/fail
- Clean, consistent display on gear and profile pages

---

### Data model

Table: `sharply_reviews` (Drizzle: `reviews`)

- `id` (uuid)
- `gear_id` (fk → gear)
- `created_by_id` (fk → users)
- `status` enum: `PENDING | APPROVED | REJECTED` (default `PENDING`)
- `content` (text)
- `genres` (jsonb string[]; 1–3 values from `REVIEW_GENRES`)
- `recommend` (boolean)
- `created_at`, `updated_at`

Table: `app.review_flags` (Drizzle: `reviewFlags`)

- `id` (uuid/text)
- `review_id` (fk → reviews)
- `reporter_user_id` (fk → users)
- `status` enum: `OPEN | RESOLVED_KEEP | RESOLVED_REJECTED | RESOLVED_DELETED`
- `resolved_by_user_id` (nullable fk → users)
- `resolved_at` (nullable timestamp)
- `created_at`, `updated_at`

Related taxonomy: `app.genres` (Drizzle: `genres`)

- `id` (uuid)
- `name` (text, unique)
- `slug` (text, unique)
- `description` (text)
- `applies_to` (string[]; optional) – values may include "camera" and/or "lens". When null/empty, the genre is considered broadly applicable.
- `created_at`, `updated_at`

Migrations

- 0011: base reviews table + status enum
- 0018: add `genres` jsonb and `recommend` boolean
- 0028+: add `genres.applies_to` string[]

Constants

- `REVIEW_GENRES` lives in `src/lib/constants.ts` and is the single source of selectable genres.

---

### Moderation gate

All review submissions pass through one backend safety function:

- Module: `src/server/reviews/moderation/service.ts`
- Entry point: `testReviewSafety({ userId, body, userAgent?, now?, skipRateLimit? })`

Checks are applied in order:

1. Trim + minimum length (`>= 2`)
2. Link/domain blocking (`http(s)://`, `www.`, domain-like text)
3. Profanity filter (`obscenity` matcher)
4. Conservative bot UA heuristics
5. Rate limit windows (`1/10s`, `5/60s`, `20/10m`)

Failure codes:

- `REVIEW_TOO_SHORT`
- `REVIEW_LINK_BLOCKED`
- `REVIEW_PROFANITY_BLOCKED`
- `REVIEW_BOT_UA_BLOCKED`
- `REVIEW_RATE_LIMITED` (with `retryAfterMs`)

---

### Public API

1. Create review

- Method: POST `/api/gear/[slug]/reviews`
- Body (validated):

```json
{
  "content": "string (required)",
  "genres": ["portraits", "wildlife"], // 1..3
  "recommend": true, // boolean
  "clientUserAgent": "optional user agent string"
}
```

Rules:

- Must be authenticated
- Enforces 1 review per user per gear
- New reviews that pass moderation are created with `APPROVED` status
- Moderation failures are returned as typed product responses (not exceptions)

Responses:

- Success (201):

```json
{
  "ok": true,
  "review": { "id": "…" },
  "moderation": { "decision": "APPROVED" }
}
```

- Duplicate (409):

```json
{
  "ok": false,
  "type": "ALREADY_REVIEWED",
  "message": "You have already reviewed this gear item."
}
```

- Moderation blocked (400/429):

```json
{
  "ok": false,
  "type": "MODERATION_BLOCKED",
  "code": "REVIEW_RATE_LIMITED",
  "message": "You're submitting reviews too quickly. Please wait.",
  "retryAfterMs": 42000
}
```

2. List gear reviews

- Method: GET `/api/gear/[slug]/reviews`
- Returns APPROVED reviews only, newest first
- Joins minimal user info for avatar/name

```json
{
  "reviews": [
    {
      "id": "…",
      "content": "…",
      "genres": ["portraits", "landscape"],
      "recommend": true,
      "createdAt": "…",
      "createdBy": { "id": "…", "name": "…", "image": "…" }
    }
  ]
}
```

3. "Do I have a review?" probe

- Method: GET `/api/gear/[slug]/reviews?mine=1`
- When authenticated, returns whether current user has a review for this gear (any status)

```json
{ "hasReview": true, "status": "APPROVED" }
```

4. Flag a review

- Method: POST `/api/reviews/[id]`
- Rules:
  - Must be authenticated
  - Cannot flag your own review
  - Only one open flag per user per review
- Behavior:
  - Does not auto-hide the review
  - Adds a moderation queue item for staff

5. Delete own review

- Method: DELETE `/api/reviews/[id]`
- Rules:
  - Must be authenticated
  - Must own the review
- Behavior:
  - Hard deletes the review row
  - Resolves open flags for that review as `RESOLVED_DELETED`
  - Triggers async summary refresh attempt for the gear

---

### Admin API (moderation)

All moderation actions are available to `MODERATOR`+ roles.

- GET `/api/admin/reviews` – list with gear/user context and open flag stats
- POST `/api/admin/reviews/[id]/approve` – sets status to `APPROVED`
- POST `/api/admin/reviews/[id]/reject` – sets status to `REJECTED`

Admin UI: `ReviewsApprovalQueue` (`src/app/(app)/(admin)/admin/reviews-approval-queue.tsx`)

- Shows reported reviews (open flag count + last report timestamp) with:
  - Keep & clear flags
  - Delete review
- Shows pending cards with Approve/Reject actions (legacy/manual items)
- Shows resolved section below

---

### Gear page integration

Unified component: `GearReviews` (`src/app/(app)/(pages)/gear/_components/gear-reviews.tsx`)

- On mount, performs two requests in parallel:
  - Fetch approved reviews for display
  - Fetch `?mine=1` to decide whether to show the banner
- Shows a single skeleton under a persistent "Reviews" header while loading
- When the user is signed out: banner shows "Log in to leave a review" and the button links to sign in with `callbackUrl` back to the gear page
- When signed in and no existing review: banner shows "Write a Review" which opens the modal composer
- When user has already reviewed this gear: banner hides

Composer: `GearReviewForm`

- Fields:
  - Genres (checkbox list, max 3, from `REVIEW_GENRES`)
  - Recommend (Yes/No)
  - Your review (textarea)
- Validation: at least 1 genre, at most 3; recommend required; non‑empty content
- Submits to POST endpoint with typed moderation handling
- On moderation failure:
  - Keeps entered input intact
  - Shows precise feedback message
  - Shows retry wait for rate limits

List: `GearReviewsList`

- Displays avatar/name on left, date floated to the right
- Genres as pills (capitalized from constants)
- Recommended / Not Recommended under the name
- Newest first
- Per-review actions menu (ellipsis):
  - Own review: `Delete review`
  - Other users’ review: `Flag for moderation`

---

### Profile page integration

Component: `UserReviewsList` (`src/app/(app)/(pages)/u/_components/user-reviews-list.tsx`)

- Accepts `userId` prop
- Fetches via `/api/user/reviews?userId=…`
- If omitted, falls back to current user
- Renders each review with a link to the gear page

API: `/api/user/reviews`

- Supports `?userId` for public profile views
- Otherwise returns the authenticated user’s reviews
- Response shape is flattened for easy rendering:

```json
{
  "reviews": [
    {
      "id": "…",
      "content": "…",
      "status": "APPROVED",
      "createdAt": "…",
      "gearId": "…",
      "gearSlug": "…",
      "gearName": "…",
      "gearType": "…",
      "brandName": "…"
    }
  ]
}
```

---

### Roles & gating

- Roles are stored on `users.role` (`USER | MODERATOR | EDITOR | ADMIN | SUPERADMIN`)
- Admin moderation tooling is gated to `MODERATOR`+.

---

### UX notes

- One review per user per gear is enforced server‑side
- New reviews are published immediately when they pass moderation
- The banner respects current user state: signed out (signin CTA), signed in (write), already reviewed (hidden)
- The sign‑in CTA uses a `callbackUrl` that returns the user to the same gear page after auth

---

### Future enhancements

- Optional structured tags (complaints/highlights) and usage hours
- Helpful votes and surface order by quality
- Editor responses / follow‑ups
- Rich text (restricted) for better readability
