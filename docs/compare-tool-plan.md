Yep—**FCB (Floating Compare Button)** is the better name. Here’s the **full, code-free plan** incorporating your adjustments and laying out the MVP cleanly.

---

# Sharply Compare — Full MVP Plan (No Code)

## 1) Naming & Scope

- **Component name:** FCB (Floating Compare Button).
- **Comparison limit:** **2 items max** (sharper UX, clearer copy, simpler decisions).
- **Platforms:**
  - **Mobile:** simplified “key notes + highlighted differences + search,” with a gentle nudge to desktop for full spec tables.
  - **Desktop:** dense, full side-by-side with difference highlighting.

---

## 2) FCB (Floating Compare Button) — Behavior & States

- **Placement:** bottom-right, fixed; respects mobile safe areas.
- **States:**
  - **Empty (0 items):** a single FCB labeled “Compare.” Tap opens the global Command Palette search.
  - **One item:** FCB expands to show a chip with the item name and a remove (×). Include a small “+ Add” action to open search.
  - **Two items:** FCB shows two chips (each removable). The primary **Compare** action becomes enabled and navigates to the compare page.

- **Guardrails:**
  - If “Add to compare” is tapped while 2 items already exist: show a **toast warning** (“You can only compare 2 items. Replace one to continue.”).
  - When a third is attempted, offer a **Replace A / Replace B** decision (action sheet or inline).

- **Quick actions on FCB:** remove individual items; swap order (optional nicety); open search to add the second item.
- **Quick actions on FCB:** remove individual items; clear all; swap order (optional nicety); open search to add the second item.

---

## 3) Global “Add to Compare” Button (Single Reusable Component)

- **Surfaces:** gear cards, gear detail pages, search suggestions/typeahead rows, lists.
- **Behavior:**
  - Toggles “added” state when an item is part of the current pair.
  - Centralized logic for add/remove/replace and toast messaging.
  - Size/format variants (icon-only, small with label, medium with label) to fit all surfaces.

- **Copy guidelines:**
  - Default: “Add to compare” (or icon-only where space is tight).
  - When added: “Added” (non-primary visual treatment).
  - When full: tap triggers the 2-item warning and the replace flow.
  - Toasts: use the existing Sonner toast system with concise copy.

---

## 4) Centralized Compare Store (Hook/Context/Store)

- **State shape:** a simple **2-slot** array (0..2 items), plus helpers (contains, isFull).
- **Core actions:** add, remove, clear, replaceAt, addOrReplace.
- **Persistence (MVP):** localStorage only. Optional profile sync can follow in a later phase.
- **URL helper:** construct a canonical compare URL using alphabetically sorted slugs (stable linking) via the existing URL utilities.
- **Event hooks:** append popularity events when a gear is added to compare (and on replace), aligning with the existing `compare_add` event.
- **Implementation note:** prefer a lightweight React context for MVP; avoid introducing new state libraries.
- **Clearability:** expose a one-tap "Clear" action in FCB to reset local storage quickly.

---

## 5) Entry Points & Flows

- **From anywhere:** tap **Add to Compare** → FCB animates to reflect the new state.
- **From empty FCB:** tap “Compare” → opens command-palette search to find item #1.
- **From FCB with one item:** tap “+ Add” → search for item #2.
- **From two items:** tap “Compare” → navigates to **/compare** with the canonical pair.

---

## 6) Routing & URLs

- **Canonical query URL:** `/compare?i=slugA&i=slugB` using the exact `gear.slug` values (no re-slugging), sorted alphabetically for a stable link.
- **Optional pretty URL for editorials:** `/compare/slug-a-vs-slug-b` (server can redirect from the query URL when a staff comparison exists).
- **Shareability:** FCB and compare page expose a “Copy link” that always uses the canonical query format.

---

## 7) Compare Page — Mobile (Simplified)

- **Header:** two compact identity chips (thumbnail + name), with remove and optional swap.
- **Top “Key Notes” strip (5–8 rows max):** context-aware by gear type.
  - Cameras: Price, Weight, Sensor/Format, ISO range, FPS/Buffer, IBIS, Battery, Popularity badge.
  - Lenses: Price, Weight, Focal range (or Prime), Max aperture, Stabilization, Filter thread, Minimum focus/magnification, Popularity badge.

- **Highlighted Differences list:** shows only rows where values diverge; subtle color cues for better/lesser; each row expands to a short explanation.
- **Search bar:** sticky; typing a term jumps to or reveals that spec row even if it’s not part of the top highlights.
- **Footer banner:** “This is the quick view. Open on desktop for full spec tables.” Include a Save/Share action to continue later.

---

## 8) Compare Page — Desktop (Full)

- **Table layout:** pinned headers; dense grid; zebra striping; “differences first” toggle; grouped sections (Build, Optics, Performance, Price).
- **Parity:** reuse existing spec table renderers where possible to ensure value parity with gear pages.
- **Decision Banner (when editorial exists):**
  - Verdict (“Best overall,” “It depends,” “Tie/custom”).
  - “Reasons to choose X” bullets for each side (3–6 each).
  - Direct links to both gear pages.

- **Side/inline blocks:** staff verdict, AI summaries of user reviews (short, neutral), ownership/popularity indicators.

---

## 9) Editorial Comparisons (Staff)

- **CMS content type (Directus):** two gear references by slug or ID, a verdict enum, bullets for reasons for each, optional decision note, and a fixed slug format.
- **Rendering:**
  - If present, show Decision Banner + staff section.
  - If absent, fall back to neutral summary with differences and regular links.

- **Delivery:** statically generate selected/“popular” pairs; fallback to on-demand rendering for non-staff pairs.
- **Static vs dynamic handling:** if an editorial exists for the canonical pair, serve the statically generated page. Otherwise, keep the canonical query URL dynamic and 301 redirect `/compare/slug-a-vs-slug-b` to `/compare?i=slugA&i=slugB`.

---

## 10) AI & Community Signals (Lightweight MVP)

- **AI summaries:** short, safe summaries of community reviews (tone-policed, non-marketing).
- **Community signals:** review count, recommend ratio, ownership and wishlist totals, and a small “Trending in last 30 days” badge where warranted.
- **Placement:** concise under each item’s identity block; expandable on mobile.

---

## 11) Popularity & Analytics

- **Compare popularity event (per-gear):** when a gear is added to compare (and when a replace occurs), append a per-gear `compare_add` event.
- **Pair-level popularity (aggregation plan):** maintain a canonical pair key built from sorted gear IDs or slugs (e.g., `slugA|slugB`). On compare page render and on replace, increment an in-memory or product-analytics counter keyed by the pair. Nightly, derive a prioritized list of top pairs for SSG/editorial consideration. Keep DB writes per-gear only for now; pair metrics live outside DB until proven necessary.
- **Usage analytics:** track add/remove actions, replace choices, and compare page visits to learn common pairings and drop-offs.
- **Future use:** fuel “Often compared with” suggestions on gear pages, and “Popular comparisons” landing modules.

---

## 12) UX Copy & Feedback

- **Toasts:**
  - First add: “Added to compare. Pick one more.”
  - Full state add attempt: “You can only compare 2 items. Replace one to continue.”
  - Remove: “Removed from compare.”

- **Empty compares:** friendly helper text; direct prompt to open search.
- **Accessibility:** high-contrast difference highlighting, clear focus states, large tap targets, VoiceOver/ARIA support for chips and actions.

---

## 13) Performance & Quality

- **Loading:** small skeletons (identity chips, 5–8 highlights, diff rows).
- **Data:** minimal fields for mobile highlights; full field set only on desktop table.
- **Resilience:** works signed-out (local persistence); degrades gracefully if CMS editorial isn’t available.
- **SEO:** the compare page renders indexable metadata; editorial pages get enriched metadata.

---

## 14) QA Checklist (MVP)

- FCB behaves correctly in all three states (0/1/2 items) on mobile and desktop.
- Add/Remove works from gear cards, search suggestions, and the FCB itself.
- Two-item limit and replace flow are enforced everywhere.
- Canonical compare URL is always generated in a stable order.
- Mobile compares show only key notes + differences + search; desktop shows the full table.
- Popularity event fires on gear add to compare (and after pair replacement).
- Editorial content appears when available; fallback is neutral.
- Accessibility checks pass (labels, roles, focus order, tap targets).
- Copy is consistent and concise across toasts, banners, and CTAs.

---

## 15) Rollout Plan (Phased)

1. **Foundation:** global “Add to Compare,” FCB with 0/1/2 states, centralized store, command-palette entry.
2. **Compare Pages:** mobile simplified view + desktop full table; canonical URLs.
3. **Signals:** compare popularity events; basic AI/community snippets.
4. **Editorials:** CMS type + Decision Banner + SSG for selected pairs.
5. **Refinement:** replace flow polish, swap affordance, “Often compared” modules powered by events.

---

This keeps the MVP **focused, fast, and opinionated**: a tight two-item system with a purposeful mobile view and a serious desktop table—plus the right hooks for popularity, editorial, and future intelligence.

---

## 16) Stack Alignment & Gaps (Current state)

- Stack alignment
  - Command Palette is already global; FCB can open it to add items.
  - Toasts use Sonner; keep messages short and consistent with existing patterns.
  - Popularity enums and rollups include `compare_add`; counts are per-gear, not per-pair.
  - URL utilities exist for building canonical query strings; ensure slugs are sorted for stable links.
  - Follow server layering: data → service → actions; compare reads should live in service and be consumed by server components.

- Gaps to implement for MVP
  - Central compare store/context (localStorage persistence) does not exist yet.
  - Global “Add to Compare” component is not yet implemented across gear cards/detail/search.
  - `/compare` route/page is not present; implement as an App Router server component that reads two slugs and renders mobile/desktop variants.
  - No action/service currently appends `compare_add`; add a thin server action that delegates to a popularity service to write this event, mirroring existing patterns.
  - Pair-level analytics are not persisted in the database; if needed, handle via product analytics. Keep DB events per-gear only.
  - Editorial comparison CMS type is not defined; keep as a later phase before enabling pretty URLs and Decision Banner.
  - Differences highlighting is non-trivial; start with “Key Notes” and reuse existing spec mapping/row renderers to ship quickly.
  - Profile-sync of compare state is out of scope for MVP; revisit post-launch.
