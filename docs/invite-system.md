# Invite System

This document describes the one-time invite link system added for app launch.

## Overview

- Admins can create invite links from `admin/private` with:
  - invitee name (for VIP welcome)
  - target role (`USER`, `EDITOR`, or `ADMIN`)
- Visiting `/invite/:id` shows a CTA that sends to `/invite/:id/accept`.
- The accept route sets a short-lived, httpOnly `invite_id` cookie and redirects to Better Auth sign-in (or straight to welcome if already signed in).
- After sign-in, `auth/welcome` auto-claims the invite (reads `inviteId` from query or the cookie), assigns the user name and role, and marks the invite as used.
- The user record stores the `inviteId` used.

## Schema Changes (src/server/db/schema.ts)

- New table `app.invites`:
  - `id` (pk)
  - `inviteeName` (varchar)
  - `role` (user_role enum)
  - `createdById` (fk -> user.id, restrict delete)
  - `isUsed` boolean
  - `usedByUserId` (fk -> user.id, set null)
  - `usedAt` timestamp
  - `createdAt`, `updatedAt`
- Column `users.inviteId` (varchar) holds the invite id used, for audit.

Note: `users.inviteId` does not have an FK to avoid a circular dependency.

## Server Layering

- data: `src/server/invites/data.ts`
  - `insertInvite`, `selectInvites`, `findInviteById`, `markInviteUsed`, `assignUserFromInvite`
- service: `src/server/invites/service.ts`
  - `createInvite` (ADMIN only), `listInvites` (ADMIN only), `claimInvite`
- actions: `src/server/invites/actions.ts`
  - `actionCreateInvite` server action used by admin UI

## UI

- Admin page: `src/app/(app)/(admin)/admin/private/page.tsx`
  - Form to create invites; list invites with status and shareable link `/invite/:id`.
  - Sidebar updated to show Private to `ADMIN` only.
- Invite landing: `src/app/(app)/invite/[id]/page.tsx`
  - Shows the invitee name/role and a button to Accept (`/invite/:id/accept`).
- Accept route: `src/app/(app)/invite/[id]/accept/route.ts`
  - Sets `invite_id` cookie server-side (30 min). If already signed in, redirects to `/auth/welcome?inviteId=:id&next=/`; otherwise redirects to `/auth/signin?callbackUrl=/auth/welcome`.
- Welcome flow: `src/app/(app)/(auth)/auth/welcome/page.tsx`
  - Reads `inviteId` from query OR `invite_id` cookie; claims, assigns name and role.

## Flow

1. Admin creates invite in `Admin → Private` and copies link `/invite/:id`.
2. Recipient visits `/invite/:id` and clicks Accept.
3. `/invite/:id/accept` sets `invite_id` cookie (30 min). If logged in, it redirects directly to `/auth/welcome`; otherwise it redirects to `/auth/signin?callbackUrl=/auth/welcome`.
4. After auth, Better Auth sends user to `/auth/welcome` (callback).
5. Welcome claims invite and updates the user (name, role, inviteId) in DB. Existing users are upgraded if they are `USER`; higher roles are never downgraded.
6. Session callback returns updated `session.user` fields (name, role, memberNumber).

## Notes

- Links are one-time: `isUsed` prevents reuse in service layer.
- If an already-used link is visited, the landing page shows a message.
- Admins can see all invites and whether they were used and by whom.

### Logging

The system emits `console.info/error` logs for:

- actionCreateInvite start/validation/success
- service create/list/claim start/results/errors
- landing page hit/not_found/already_used/accept-route usage
- welcome page claim attempt/success/failure/error

### Session values

Session callback (`src/server/auth/config.ts`) ensures `session.user.name` and `session.user.role` reflect DB state after claim.

### Security and cleanup

- `invite_id` cookie is httpOnly and short-lived; cleanup is via expiration.
- No FK from `users.inviteId` → `invites.id` to avoid circular reference.

### Testing

1. Create an invite in `/admin/private`.
2. Visit `/invite/:id` and click Accept → sign in.
3. On `/auth/welcome`, verify name and role match the invite.
