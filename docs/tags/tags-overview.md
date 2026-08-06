# Gear tagging

Gear tags are database-backed editorial discovery labels. They supplement
structured specifications; they do not replace factual gear data such as mount,
focal length, weight, or sensor format.

## Data model

- `tags` stores a stable name and immutable URL-safe slug, short description,
  optional Lucide icon name, optional public page title/content, private
  internal notes, and `unlisted` visibility.
- `unlisted` defaults to `false`. Unlisted tags remain visible to authenticated
  tag viewers, but are excluded from `/tags` and public `/tags/[slug]` routes.
- `gear_tags` is a unique gear-to-tag junction. A gear item can have many tags,
  but cannot receive the same tag twice. Deleting gear cascades its assignments;
  a tag with assignments cannot be deleted.

## Roles and administration

Editors can open `/admin/tags`, search, and inspect the tag table. Only admins
can create, update, delete, or assign tags. The admin list uses hover actions,
shows public visibility, links listed names to their public page, and displays
the configured tag icon beside the name.

The admin form supports all currently implemented tag fields. Icon values are
plain Lucide names (for example, `Camera` or `circle-dot`); the form links to
the Lucide catalog and shows a live preview or an empty square when the value
is not recognized.

Tag assignment controls on gear pages are also admin-only. Server-side services
enforce the same role boundary; hiding a control is not the authorization
mechanism.

## Public experience

`/tags` is an ISR dictionary of listed tags. Visitors can filter the loaded
dictionary by a tag's name, slug, title, or public copy. Cards link to the
public tag page, show the tag icon, and use the public page title/content when
present, falling back to the tag name and short description.

The shared Gear navigation exposes `/tags` as **Collections**, described as a
way to browse lists of gear. The link is available in the desktop and mobile
navigation menus and the footer Gear section.

`/tags/[slug]` renders the optional page title/content, tag icon, and matching
published gear. It deliberately never returns internal notes. The gear table
supports local name/brand/slug search plus type and brand filters; it defaults
to newest-first ordering and uses the shared gear-table columns.

Each public tag page also supplies localized canonical metadata. The title uses
the configured page title (or tag name), while the description uses the short
page content (or short description) and falls back to a localized tag summary.
The tag editor provides a live search-result preview using the same precedence
and description-length limit as the public metadata.

Gear detail pages show listed assigned tags in the sidebar below popularity.
Tag chips include the optional icon and link to the public tag page. Unlisted
tags are not exposed on public gear pages.

## Caching and invalidation

The database is the source of truth. Public dictionary and detail routes use a
60-second ISR window. Admin mutations revalidate the affected dictionary and
tag routes immediately for every supported locale; assignment changes also
revalidate the affected public tag page and gear page in every locale.

## Intentionally not implemented

Tags currently have only manual, administrator-managed assignments. There are
no aliases, categories, gear-type applicability rules, lifecycle/replacement
states, assignment provenance, automated classification rules, CMS gear-query
blocks, related content, or tag-powered search/browse recommendations. Those
items remain in [the roadmap](./tagging-roadmap.md).
