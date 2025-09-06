# Badges System — Event Triggers + Threshold Families

A lightweight, event-driven badge system with a single catalog, one generator (for threshold ladders), and simple cron jobs for time-based badges and analytics.

---

## 1) Event Types (simple, stable contract)

Define a short list of events your app emits; badges “listen” to these.

- `review.approved`
- `edit.approved`
- `ownership.added` / `ownership.removed`
- `wishlist.added`
- `compare.used`
- `cron.anniversary` (time-based, yearly)
- _(add others only when truly needed)_

**DX tips**

- Keep event names `noun.verb`, all lowercase.
- Maintain a short “Event Dictionary” describing each event and its expected context fields.

---

## 2) Badge Catalog (single source of truth)

Every badge defines:

- **Key** — unique identifier
- **Family** — only meaningful for threshold ladders; use “misc” for one-offs
- **Label & Icon** — display metadata
- **Sort score** — for profile ordering
- **Triggers** — which events this badge listens to
- **Test** — the eligibility check (runs against a user snapshot and optional event context)

**DX tips**

- CI lint: every badge must have ≥1 trigger and a defined **test**.
- Prefer “deprecate/hide” over deletion to preserve history and avoid breaking references.

---

## 3) Generators (what they do and why)

Generators turn a compact, structured configuration into one or more fully-formed badge definitions with consistent metadata, tests, and sort behavior. They keep the catalog DRY and predictable while letting us author badges declaratively.

- Role
  - Produce normalized `BadgeDefinition` entries (unique keys, stable labels, colors, icons, triggers)
  - Attach a `test` function based on the provided inputs (e.g., metric threshold or time duration)
  - Apply default sorting (e.g., by ladder index) unless overridden
  - Ensure consistent labeling (roman numeral tiers for ladders)

- Typical inputs
  - Base key and family
  - Icon component and color
  - Trigger(s) the badges listen to
  - Either numeric levels + metric name (for count-based ladders) or duration thresholds (for time-based)
  - Label base and description builder; optional sort override

- Output
  - One or more catalog entries ready for evaluation and display
  - Stable, unique keys and default sort scores
  - Test functions that evaluate against the user snapshot and optional event context

- Current usage examples
  - Threshold ladders (counts-based metrics like wishlist/reviews/ownership/edits)
  - Time ladders (tenure-based anniversaries)
  - Additional generators can be introduced later if a new pattern repeats

- DX tips
  - Keep generator params data-driven; avoid per-badge bespoke code
  - Encode tiers via ladder index for roman numerals and sort order
  - Let the catalog validator enforce uniqueness and trigger membership
  - Keep the allowed trigger list small and stable; add only when needed

---

## 4) Individual Badges (everything else)

All non-ladder badges are defined one-by-one with their own **triggers** and **test**.

**Examples**

- Intentionally deferred. Add concrete examples later; keep evaluator and triggers generic.

**DX tips**

- Prefer a single, clear trigger; if a badge truly needs multiple, list both triggers rather than custom routing.

---

## 5) Trigger Routing (no family lookups in app code)

- On startup, build an index of **trigger → badges**.
- When an event fires, the evaluator loads only badges that declared that trigger.
- App code never needs to remember “which families to evaluate” — the event name is the contract.

**DX tips**

- Boot-time parity check: fail fast if any catalog badge has no valid trigger, or if a trigger isn’t in the allowed list.
- Log the number of badges per trigger at boot to spot empty or overloaded triggers.

---

## 6) Snapshot Loader (fast, shared data)

A single function returns a compact **user snapshot** used by all badge tests, for example:

- Approved edits count
- Approved reviews count
- Wishlist count
- Ownership count (optionally by brand/mount if needed)
- Join date

**DX tips**

- Keep it cheap (one round-trip or precomputed counters).
- Include only fields that at least one **test** uses; add more fields only when new badges require them.

---

## 7) Evaluator (single entrypoint)

Call **`evaluateForEvent(eventName, context)`** whenever an event occurs.

**Flow**

1. Look up badges subscribed to the event.
2. Load the user snapshot once.
3. Run each badge’s **test**.
4. If passed, upsert into `user_badges` (idempotent on `(user_id, badge_key[, context])`).

**DX tips**

- Keep the evaluator stateless and side-effect–free except for the final upsert.
- Return a summary of awarded badges for optional toasts/UX.

---

## 8) Cron Jobs (time-based + analytics)

**Anniversaries**

- Daily, find users whose signup month/day is today.
- For each, call `evaluateForEvent("cron.anniversary", …)`.

**Holders Count**

- Daily, count distinct holders per badge and update `badges.users_with_badge`.
- Optionally store `% of active users` for rarity insights.

**Consistency Sweep (optional)**

- Nightly, backfill a small slice of users across key triggers to catch anything missed.

**DX tips**

- Emit a short cron summary: processed users, badges awarded, counts updated.
- Alert if holder counts change wildly (possible bug or mass award).

---

## 9) Storage (minimal)

**badges** (defer initially)

- `key`, `family`, `label`, `icon`, `sort_score`, `hidden?`, `users_with_badge`, timestamps
- Note: start without this table to keep v1 lean; add when admin/analytics need it.

**user_badges**

- `user_id`, `badge_key`, `awarded_at`, `source` (“auto”/“manual”), _(optional)_ `context`, _(optional)_ `sort_override`
- v1 implementation: unique on `(user_id, badge_key)`; expand to include `context` if/when badges require multi-context awards.

**(optional) badge_awards_log**

- Append-only for audit/analytics (who earned what, when, via which trigger)

**DX tips**

- Prefer soft-delete/hidden over hard deletes.
- Unique constraint on `(user_id, badge_key[, context])` prevents duplicates.

---

## 10) Profile Display (simple, consistent)

- Sort user badges by `sort_override ?? sort_score` (DESC), then `awarded_at` (DESC).
- Show top badges on profile; “See all” reveals the rest.
- Use concise tooltips (e.g., “25 approved reviews”, “Member since 2022-03-04”).

---

## 11) DX Utilities (make it pleasant to build & test)

**A) Dry Run (no writes)**

- Purpose: verify which badges _would_ pass for a user & event.
- Inputs: event name, user id, optional context (e.g., item release date).
- Output: list of badge keys that passed, plus a short explanation (metric values vs. thresholds).
- Uses: PR review, debugging, support tickets, admin preview.

**B) Simulator (state & time sandbox)**

- Purpose: test badge functionality without real data changes.
- Modes:
  - Metric override: temporarily set snapshot values (simulate “approvedReviews=25”).
  - Time travel: run tests at a custom timestamp (Night Owl, Anniversary).
  - Event player: replay a sequence of events to observe expected awards.
- Output: timeline of which badges would trigger, with reasons.

**C) Admin Panel & Logs**

- Badge catalog viewer: search/filter by family, trigger, visibility; show triggers and test descriptions.
- Trigger coverage report: which badges listen to each trigger; highlight empty triggers.
- User badge history: awards, source, timestamps; export CSV for support.
- Awards feed (last 24h): who earned what; filter by trigger.
- Holders dashboard: counts per badge, trend lines; surface outliers (sudden spikes).
- Backfill tools: “Recompute for user,” “Recompute for badge,” “Recompute for trigger.”
- Diagnostics: dry-run and simulator built into the panel for any user/event.

**D) CI & Guardrails**

- Catalog lints: every badge has trigger(s) and test; keys are unique; ladder generators produce valid keys.
- Trigger sanity: all triggers referenced by badges exist in the allowed list.
- Snapshot contract: tests only reference fields present in the snapshot (catch typos early).
- Smoke dry-run: sample a few real users in CI (read-only) to ensure no catastrophic selector changes.

---

## 12) Why This Version Works

- **Event-driven**: badges self-subscribe via triggers; app code just emits events.
- **Minimal abstraction**: one generator for threshold ladders; everything else stays as simple individual badges.
- **Cron-ready**: anniversaries and analytics handled cleanly without special cases in app code.
- **DX-first**: dry run, simulator, admin visibility, and CI guardrails keep iteration safe and fast.
