# Tagging roadmap

This document covers work beyond the implemented manual tag registry, public
dictionary/pages, icons, unlisted visibility, and admin-only management.

## Registry and lifecycle

- Add aliases, category, applicable gear types, and assignment behaviour.
- Add lifecycle states for active, private, deprecated, and replacement tags.
- Support replacements and redirects so deprecated public tag URLs retain value.
- Keep layouts and specialized presentations code-owned. The database may select
  a safe presentation key, but must not store executable React components.

## Assignment provenance and automation

Replace the current single manual assignment with effective assignments plus
source claims. An assignment may be supported by admin, import, or automatic
rule claims. Automatic recalculation must reconcile only its own claims and
must never remove an admin or import claim.

Implement pure application-code rules under `src/server/tags/rules`, returning
claims with stable rule IDs and admin-facing reasons. Early examples include
lens focal-length categories, compact dimensions/weight, and review-derived
most-loved tags. Run rules after relevant gear, review, popularity, and import
events, with a preview for proposed additions, removals, and preserved claims.

## Public discovery and content

Extend public tag pages with related guides, lists, and adjacent tags. Use tags
to supplement browse filters, related content, similar gear, alternatives, and
recommended pairings—never as a substitute for structured specifications.

If public content needs rich layouts, store safe structured content such as
Payload/Lexical JSON; do not store executable React components in `tags`.

## CMS gear-query block

Add a Payload Lexical `gearQuery` block that stores query configuration rather
than gear IDs. It should combine tag filters with gear type, brand, mount,
structured specs, price, sorting, and result limits. The frontend renderer must
use a validated gear service so results stay current.

## Further admin tooling and verification

- Add reports for unused, invalid, conflicting, deprecated, and replacement
  tags.
- Add coverage for provenance precedence, rule reconciliation, public
  exclusions, redirects, CMS-query validation, and cache invalidation.
- Consider Next cache tags for finer-grained invalidation if the current route
  revalidation strategy becomes insufficient.
