## Review System

This document describes the end‑to‑end user review system for gear pages: data model, APIs, UI flows, moderation, and integration points.

### Goals

- One review per user per gear
- Minimal, structured inputs (use cases + recommendation + freeform text)
- Fast write with delayed publish (admin approval)
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

Migrations

- 0011: base reviews table + status enum
- 0018: add `genres` jsonb and `recommend` boolean

Constants

- `REVIEW_GENRES` lives in `src/lib/constants.ts` and is the single source of selectable genres.

---

### Public API

1. Create review

- Method: POST `/api/gear/[slug]/reviews`
- Body (validated):

```json
{
  "content": "string (required)",
  "genres": ["portraits", "wildlife"], // 1..3
  "recommend": true // boolean
}
```

Rules:

- Must be authenticated
- Enforces 1 review per user per gear
- New reviews are created with `PENDING` status

Response (201): `{ message, review }`

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
{ "hasReview": true, "status": "PENDING" }
```

---

### Admin API (moderation)

All endpoints require role `EDITOR` or `ADMIN`.

- GET `/api/admin/reviews` – list with gear/user context (pending and resolved)
- POST `/api/admin/reviews/[id]/approve` – sets status to `APPROVED`
- POST `/api/admin/reviews/[id]/reject` – sets status to `REJECTED`

Admin UI: `ReviewsApprovalQueue` (`src/app/(app)/(admin)/admin/reviews-approval-queue.tsx`)

- Shows pending cards with Approve/Reject actions
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
- Submits to POST endpoint; shows success copy and hides the banner

List: `GearReviewsList`

- Displays avatar/name on left, date floated to the right
- Genres as pills (capitalized from constants)
- Recommended / Not Recommended under the name
- Newest first

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

- Roles are stored on `users.role` (`USER | EDITOR | ADMIN`)
- Admin endpoints and dashboard are gated to `EDITOR` or `ADMIN`

---

### UX notes

- One review per user per gear is enforced server‑side
- New reviews show success copy and remain hidden on the gear page until approved
- The banner respects current user state: signed out (signin CTA), signed in (write), already reviewed (hidden)
- The sign‑in CTA uses a `callbackUrl` that returns the user to the same gear page after auth

---

### Future enhancements

- Optional structured tags (complaints/highlights) and usage hours
- Helpful votes and surface order by quality
- Editor responses / follow‑ups
- Rich text (restricted) for better readability
