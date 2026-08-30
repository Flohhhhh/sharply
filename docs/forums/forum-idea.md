# Sharply Forum — product idea

## End goal

The Sharply Forum should become a public, durable knowledge base for
photographers. People should be able to read practical questions, field notes,
troubleshooting, buying advice, and gear-specific discussions without creating
an account. Account holders should be able to add context and experience to
those discussions, while the best contributions remain useful as indexed
reference material long after the original activity has slowed down.

The forum should balance two modes:

- **Knowledge:** well-structured, searchable discussions that can answer
  recurring photography and gear questions.
- **Activity:** a current stream of conversations, replies, feedback, and
  community participation.

It should feel like part of Sharply rather than a separate social network. The
gear database remains the central product, and forum discussions should be able
to connect to gear when that improves context without forcing every post to be
about a product.

## Product shape

The primary route is `/forum`. The home page is a simple category directory,
with a `Categories` tab and a `Latest` tab. Categories are the main way to
orient people, while Latest provides an activity-oriented view. A discussion
has its own route at `/forum/t/:id`, and moderation lives at `/admin/forums`.

The initial taxonomy is intentionally flat. Categories are enough for the
current scale; domains, groups, and subcategories should only be introduced
when real usage shows that a flat list is no longer understandable.

## Requirements and decisions

### Reading and participation

- Posts and threads must be readable without an account.
- Authentication is required to create threads and reply.
- There is no anonymous posting. Author identity and useful account metadata
  should remain visible on every post.
- The original poster, site moderators, and administrators should be able to
  mark or remove the best answer once the corresponding moderation permissions
  are exposed.
- Closed threads cannot receive replies.

### Categories

- Only administrators can create and manage posting categories.
- Categories should have a name, description, slug, sort order, and activity
  counts.
- Category links should filter the Latest view.
- Do not add domains or subcategories yet.

### Gear relationships

- A discussion may link to one or more internal Sharply gear items.
- A post may eventually embed an internal gear link as a horizontal gear card.
- A post is not required to be associated with gear.
- Gear links should use internal routes and remain useful in search and
  long-lived reference content.

### Content and editing

- The editor should be a minimal WYSIWYG editor with Markdown-like keyboard
  shortcuts.
- It must support headings, emphasis, strikethrough, lists, blockquotes,
  inline code, links, and undo/redo.
- New content should use a structured format that can grow into custom nodes
  for images, gear cards, mentions, and other forum elements.
- Existing Markdown and plain-text posts must remain renderable.
- Raw HTML must never be rendered directly.
- Links must be restricted to safe HTTP(S), internal relative URLs, and safe
  fragments.
- Posts should be deletable fully. The product should retain only the minimal
  edit history needed for moderation and accountability.

### Layout and interaction

- The forum route has its own layout with a fixed-width left navigation rail
  and a full-width content area.
- There is no right sidebar on the forum home or thread pages.
- The shared site header remains in place.
- The footer belongs to the content scroll area, not a fixed sidebar.
- The thread page should use an editorial reading layout: the title and
  breadcrumbs use the main content edge; each post's content is inset; the
  author avatar sits in a sticky rail on the left.
- Post blocks should use separators rather than card backgrounds.
- The first post includes a compact stats and participant section below its
  content.
- New threads and replies should open in a custom floating bottom-right drawer
  based on the existing shadcn/Vaul primitives. It should preserve normal page
  scrolling as much as possible and keep draft text when closed and reopened.

## Things to consider

### Taxonomy should follow behavior

The forum should not begin with a complex hierarchy. A small number of clear
categories is easier to scan, easier to administer, and less likely to leave
new discussions stranded in overly specific buckets. If the category list
becomes long, domains or subcategories can be added as a deliberate migration.

### Moderation is part of the product, not an afterthought

The eventual moderator workflow needs reporting, review, deletion, restoring,
locking, moving, and audit history. Site moderators should be able to protect
the forum without giving them unrelated site-administration privileges.

### Counts need explicit definitions

Views, replies, participants, and category totals should have clear rules for
deleted content, automated traffic, and edits. A link count should only be
shown if Sharply actually tracks link clicks.

### Search and indexing need structure

Threads should have stable, readable metadata, canonical URLs, useful page
titles and descriptions, and safe structured content. Search and pagination
will become important before the forum grows beyond a small set of recent
threads.

### Safety and trust

Authentication alone is not enough to prevent abuse. Rate limits, spam
controls, reporting, safe link handling, visible authorship, and clear
deletion behavior should be designed before opening the forum to significant
traffic.

### Drafts and editor evolution

The current draft context is useful for reopening a composer during the same
session. If users need drafts to survive refreshes or devices, persistence
should move to browser storage or a server-backed draft model. The editor's
node registration and renderer should remain extensible without exposing
images or custom elements before their storage and moderation rules are ready.

### Mobile and accessibility

The sticky author rail must collapse gracefully on narrow screens. Composer
focus management, keyboard navigation, labels, link dialogs, reduced motion,
and screen-reader announcements should be treated as core behavior.

## Suggested future order

1. Complete post edit/delete behavior and minimal history.
2. Build report review and moderation actions.
3. Add thread locking, pinning, and category management beyond creation.
4. Add pagination, search, and reliable view tracking.
5. Add gear linking and horizontal gear cards.
6. Add subscriptions and reply notifications.
