# User Handle System

The Handle System provides unique, human-readable identifiers for user profiles (e.g., `sharply.com/u/my-handle`), replacing UUIDs in public-facing URLs.

## 1. Resolution Logic

Profile routes (`/u/[handle]`) resolve users using a multi-step fallback strategy in the `fetchUserByHandle` service:

1.  **Direct Match**: Checks the `handle` column in the `users` table for an exact (case-insensitive) match.
2.  **Default Fallback**: If the input matches the pattern `user-{number}`, it attempts to look up the user by their `memberNumber`. This only succeeds if that user has **not** yet set a custom handle.
3.  **Legacy UUID**: If the input is a valid UUID, it resolves via user ID for backward compatibility and internal linking.

## 2. Validation & Constraints

Handles are validated via Zod in the service layer:

- **Format**: 3–50 characters, alphanumeric with hyphens and underscores (`[a-zA-Z0-9_-]`).
- **Uniqueness**: Enforced by a unique database index on `users.handle`.
- **Reserved Words**: Certain handles are blocked to prevent system impersonation or route conflicts:
  - System: `admin`, `official`, `sharply`, `api`, `auth`, `settings`.
  - Routes: `gear`, `lists`, `u`, `explore`, `search`, `notifications`, `welcome`.

## 3. Onboarding & Engagement

To encourage adoption without forcing friction during sign-up:

- **Virtual Handles**: Every user automatically "owns" `user-{memberNumber}` until they pick a custom one.
- **Profile Banner**: If a user views their own profile and hasn't set a handle, a `HandleSetupBanner` appears at the top.
- **Automated Notification**: The first time a user without a handle visits their profile, a `prompt_handle_setup` notification is triggered to guide them to settings.

## 4. Key Implementation Files

- **Schema**: `src/server/db/schema.ts` (Handle column & Unique index).
- **Service**: `src/server/users/service.ts` (`fetchUserByHandle`, `updateUserHandle`).
- **Form**: `src/app/(app)/(pages)/profile/settings/user-handle-form.tsx` (Live availability checks).
- **Banner**: `src/app/(app)/(pages)/u/_components/HandleSetupBanner.tsx`.
- **API**: `src/app/(app)/api/users/check-handle/route.ts` (Used for real-time validation).
