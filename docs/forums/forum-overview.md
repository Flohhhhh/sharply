# Sharply Forum — implementation overview

This document describes the forum functionality currently implemented. The
product direction and future considerations are documented in
[`forum-idea.md`](./forum-idea.md). The lower-level schema and server-layer
reference remains in [`../forum-system.md`](../forum-system.md).

## Routes and layout

- `/forum` is a public forum home page.
- `/forum/t/:id` is a public thread page.
- `/forum/new` is a compatibility route that redirects to the thread composer
  on `/forum`.
- `/admin/forums` is available to administrators only and provides the current
  admin-only category creation surface.

The forum has a dedicated route layout with the existing site header, a fixed
left navigation rail, and a full-width scrollable content area. The footer is
inside the content scroll area. The right sidebar was intentionally removed.

The forum home page has a content-switching `Categories` / `Latest` tab pair.
The tabs do not navigate by anchor or scroll the page. Category rows are
clickable and show discussion counts, reply counts, and the latest activity.
The Latest view supports category filtering through the URL.

## Thread presentation

Thread pages currently include:

- Breadcrumbs linking back to Forums and the selected category, followed by the
  current thread title.
- A divider below the title and breadcrumb section.
- A reading layout where post content is inset from the title edge.
- A left author rail with a sticky avatar and author name in the content row.
- Relative time and post number aligned to the right of each post header.
- Border separators instead of individual post card backgrounds.
- A compact first-post stats section for views, replies, and participants.
- Participant avatars in that stats section.
- A first-post bonus section with explicit top and bottom dividers.
- Best-answer status and a contextual options menu for users allowed to manage
  the answer.
- Reply entry for open threads and a locked state for closed threads.

The post avatar uses the author's image when available and a neutral fallback
icon otherwise. The current participant count is based on distinct post
authors. The displayed view count is stored on the thread, but view tracking
and its counting policy still need to be completed.

## Composer

Thread creation and replies use one shared composer implementation. The
composer is a custom floating bottom-right drawer built from the duplicated
shadcn/Vaul-style primitive in `src/components/ui/floating-drawer.tsx`.

Current behavior:

- New threads and replies share the same drawer and editor components.
- Thread mode includes title, category, and body fields.
- Reply mode includes the body field only.
- The drawer is non-modal so the page can remain scrollable behind it.
- The drawer is compact and positioned in the bottom-right corner.
- The Vaul drag interaction is retained for opening and closing.
- Draft content is held by the forum compose draft context so closing and
  reopening during the current page session restores the form.
- Closing or discarding clears the compose query parameter.
- Unauthenticated users are sent through sign-in with a callback that restores
  the intended thread or reply composer.
- `/forum/new` remains available for old bookmarks and callbacks.

The editor keeps validation errors inside the composer instead of turning
validation failures into an unhandled page error.

## Editor and content rendering

`src/components/forum/forum-editor.tsx` provides a minimal Lexical editor with:

- Bold, italic, and strikethrough
- Paragraph and heading styles
- Bulleted and numbered lists
- Blockquotes
- Inline code
- Link insertion/editing
- Undo and redo
- Markdown keyboard shortcuts
- A Typography-styled editable surface consistent with article and Learn
  pages

New editor state is serialized as Lexical JSON into the existing text content
column. `ForumPostContent` detects valid Lexical JSON and renders supported
nodes. Legacy Markdown and plain text use a safe fallback renderer with GFM
support. Raw HTML is not rendered, and links are limited to safe HTTP(S),
internal relative links, and fragments. External links receive new-tab and
`rel` attributes.

The content layer has an extension point for future image, gear-card, mention,
and custom Lexical nodes. Those nodes are not currently exposed in the editor.
Posts are validated using extracted visible text, including the 20,000-character
visible-content limit and a serialized payload size limit.

## Permissions currently implemented

- Anyone can read forum content.
- Authenticated users can create threads and replies.
- Only administrators can create categories.
- The original thread author and site moderators can choose or remove a best
  answer.
- Administrators can access `/admin/forums`; moderators and editors are denied.
- Closed threads do not accept replies.

## Database and server organization

Forum tables are declared in `src/server/db/schema.ts` and use the PostgreSQL
`forum` schema for organization. The forum data layer follows the project
server structure:

- `src/server/forum/data.ts` contains database reads and writes.
- `src/server/forum/service.ts` performs validation, authorization, and
  orchestration.
- `src/server/forum/actions.ts` exposes mutation actions and revalidation.

The current schema includes tables for categories, threads, posts, thread gear
links, post gear links, post edit history, and reports. The gear-link, edit,
delete, and report tables establish the data model, but their full user-facing
workflows are not implemented yet.

## Admin area

`/admin/forums` currently provides:

- Forum category count and open-report count
- Admin-only category creation
- A list of existing categories and their slugs
- Moderator visibility into the open-report area

Report review actions, post deletion, thread locking, pinning, category
editing, reordering, and archival are future moderation work.

## Known gaps

The current implementation is a functional foundation, not a complete
production forum. The main gaps are:

- Post editing, full deletion, and edit-history UI
- Report creation and moderator resolution actions
- Thread lock/reopen, pinning, hiding, and category moves
- Pagination, search, and larger-volume loading behavior
- Reliable view-count tracking and explicit counter definitions
- Gear selection and rendered gear cards
- Thread subscriptions and notifications
- Browser/server-persistent drafts if persistence across refreshes is needed
- Rate limiting and spam controls
- Expanded SEO metadata and structured data validation
