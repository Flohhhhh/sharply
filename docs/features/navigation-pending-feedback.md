# Navigation Pending Feedback

This note documents the lightweight pending-navigation feedback patterns currently used in the app.

## Goal

Use link-level pending UI only where a click target can otherwise feel unresponsive for a short delay.

Current intent:

- prefer local feedback on large cards, rows, and CTA surfaces
- avoid noisy loaders on dense nav like the main header
- keep layout stable while a pending state is shown

## Core Mechanism

All current implementations use Next.js `useLinkStatus()` from a descendant rendered inside a `Link`.

Why:

- the pending state stays scoped to the clicked link
- no router-level custom state is needed for simple cases
- multiple links on the page do not all enter loading at once

## Current Implementations

### Case-by-case card and row patterns

These components use local pending descendants inside the link subtree:

- `src/components/gear/gear-card.tsx`
- `src/components/gear/gear-card-horizontal.tsx`
- `src/components/home/news-card.tsx`
- `src/components/trending-list.client.tsx`

Common behavior:

- fade only the visible content wrapper, not the outer layout box
- show a spinner overlay or replacement affordance in a stable position
- disable repeated interaction with `pointer-events-none`
- expose stable `data-*` markers for unit and Playwright assertions

Use this approach when the surface has custom composition:

- image cards
- mixed media cards
- list rows with badges or right-side affordances
- places where the spinner position is part of the component design

### Reusable button-style links

`src/components/ui/link-button.tsx` is the reusable option for button-like links.

It exists for surfaces where:

- the link should look exactly like the shared `Button`
- the button's existing `loading` presentation is already correct
- a full custom overlay would be unnecessary

Implementation notes:

- reuses `buttonVariants` from `src/components/ui/button.tsx` for consistent styling
- binds the button loading state to `useLinkStatus()`
- keeps icon placement working for both left and right icon buttons
- marks pending state with `data-link-button-*` attributes for tests

Current usage:

- homepage CTA links in `src/app/[locale]/(pages)/page.tsx`

## Selection Guide

Use a local custom implementation when:

- the component is card-like or row-like
- the spinner needs to sit over media or in a custom slot
- the pending state should hide or replace a component-specific affordance

Use `LinkButton` when:

- the element is visually a button
- the shared button loading state is sufficient
- no custom fade/overlay treatment is needed

Do not add pending UI by default when:

- the link is small plain text nav
- the area is used constantly and extra motion would create noise
- route transitions are already effectively instant

## Testing Pattern

The current tests use two layers:

- unit tests that mock `next/link` and `useLinkStatus()` to force pending and idle states
- targeted Playwright tests that delay the first document navigation so the pending UI is visible before the route completes

Relevant files:

- `tests/unit/gear-card-navigation-pending.test.ts`
- `tests/unit/home-news-card-navigation-pending.test.ts`
- `tests/unit/trending-list-navigation-pending.test.ts`
- `tests/unit/link-button-navigation-pending.test.ts`
- `tests/playwright/basic/gear-card-pending-navigation.spec.ts`
- `tests/playwright/basic/home-news-card-pending-navigation.spec.ts`

## Header Navigation Guidance

Current recommendation is to leave the main header links without individual pending loaders.

Reasoning:

- browser and framework navigation are usually fast enough there
- per-link loaders on plain text nav are visually noisy
- repeated header use makes even subtle loading motion feel heavier than on cards or CTAs

If header navigation ever needs extra reassurance, prefer a single minimal global signal over per-link spinners.
