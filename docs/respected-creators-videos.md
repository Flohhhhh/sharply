# Content from Respected Creators

## Overview

Sharply supports a curated supporting-video layer on gear pages called **Content from Respected Creators**.

This is intentionally narrow:

- Sharply remains the primary authority for gear pages.
- External videos are editorial support, not the main content.
- Only approved creators can be selected.
- Editors manage attached videos directly from the gear page.
- The public section appears before **Articles about this item**.

The phase 1 implementation is YouTube-first and does not attempt to build a generic external links framework.

## Data Model

### `approved_creators`

Approved creators are a first-class allowlist entity.

Fields:

- `id`
- `name`
- `platform`
- `channel_url`
- `avatar_url`
- `is_active`
- `internal_notes`
- `created_at`
- `updated_at`

Behavior:

- Only active creators are selectable in the gear-page editor modal.
- Admins can create, edit, deactivate, and reactivate creators.
- Deactivation does not delete referenced gear videos.

### `gear_creator_videos`

Gear-linked creator videos are stored separately from creators.

Fields:

- `id`
- `gear_id`
- `creator_id`
- `source_url`
- `normalized_url`
- `embed_url`
- `platform`
- `external_video_id`
- `title`
- `thumbnail_url`
- `published_at`
- `editor_note`
- `is_active`
- `created_by_user_id`
- `updated_by_user_id`
- `created_at`
- `updated_at`

Behavior:

- Each record must reference an approved creator.
- No free-text creator names are stored on gear-linked videos.
- Removing a video from a gear page deactivates the link instead of hard deleting it.
- Public ordering is newest first:
  - `published_at DESC NULLS LAST`
  - then `created_at DESC`

## Permissions

- Public users can view creator videos on gear pages.
- `EDITOR+` can manage attached creator videos from the gear page.
- `ADMIN+` can manage the approved creator allowlist at `/admin/approved-creators`.

The feature uses existing Better Auth role checks through `requireRole`.

## Gear Page UX

Public display:

- Section title: **From Respected Creators**
- Shown before **Articles about this item**
- Horizontal cards with:
  - thumbnail on the left
  - title and creator metadata in the middle
  - action buttons on the right
- Copy supports both:
  - technical demonstrations
  - narrative, field-use, impression, and story-driven videos centered on the item

Editor workflow:

1. Open the gear-page manage modal.
2. Select an approved creator.
3. Paste a YouTube URL.
4. Resolve metadata.
5. Confirm and save the attached video.

Editors can also:

- remove attached videos
- edit the lightweight editorial note shown as **What this video helps show**

## Metadata Resolution

Phase 1 supports YouTube video URLs only.

Supported URL shapes:

- standard watch URLs
- `youtu.be` share URLs
- shorts URLs

Rejected:

- channel URLs
- playlist-only URLs
- other non-video YouTube pages
- unsupported providers

Resolution behavior:

- normalize to canonical watch URL
- derive embed URL
- extract the provider video ID
- attempt title and thumbnail lookup via YouTube oEmbed
- keep `published_at` nullable in MVP

Fallback behavior:

- If URL parsing fails, the editor cannot save.
- If parsing succeeds but metadata lookup fails, the editor can manually enter:
  - title
  - optional thumbnail URL
  - optional publish date

## Server Structure

The feature follows existing server layering:

- `src/server/admin/approved-creators/*` for creator allowlist CRUD
- `src/server/creator-videos/*` for gear-linked creator video reads, mutations, and metadata handling
- API routes for editor fetch flows:
  - `GET /api/gear/[slug]/creator-videos/manage-data`
  - `POST /api/gear/creator-videos/resolve`

Mutations from client components use server actions and revalidate the affected gear page or admin page.
