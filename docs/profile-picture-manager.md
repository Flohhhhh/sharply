# Profile Picture Manager

This document describes the profile picture upload and management feature added to the account settings page.

## Overview

Users can upload and manage their profile pictures from the account settings page at `/profile/settings`. Profile pictures are automatically resized to a maximum of 256px on the longest side before upload to ensure optimal performance and storage.

Custom and legacy profile images are stored in `users.image`. Discord's current OAuth avatar is stored separately in `users.discordImage`, and `users.avatarSource` records whether Sharply should display the custom or Discord image. Avatar UI surfaces render the resolved URL directly through the shared avatar component rather than wrapping it with `next/image`.

## Features

1. **Profile Picture Upload**: Users can upload images from their device
2. **Automatic Resizing**: Images are resized client-side to max 256px on longest side
3. **Real-time Preview**: Users see their current profile picture with avatar fallback
4. **Progress Indicators**: Upload and save progress are displayed to users
5. **Session Updates**: Profile picture changes are reflected immediately in the user session
6. **Avatar Source Selection**: Users with a linked, synchronized Discord account can switch between their custom and Discord images
7. **Discord Synchronization**: Discord images refresh after a Discord sign-in or immediately after a first-time Discord link without replacing a custom upload
8. **Custom Image Removal**: Users can clear their custom image without uploading a replacement; the Discord image remains available as a separate source

## Implementation

### Architecture

The implementation follows the standard Sharply server structure:

```
data/ → service/ → actions/ → UI component
```

#### Data Layer (`src/server/users/data.ts`)

```typescript
export async function updateUserImage(userId: string, imageUrl: string);
```

Raw database write to update the user's image field.

#### Service Layer (`src/server/users/service.ts`)

```typescript
export async function updateProfileImage(imageUrl: string);
```

- Validates the user is authenticated via `auth.api.getSession({ headers })`
- Validates the image URL format
- Retrieves old image URL for potential cleanup
- Updates the custom image and selects the custom avatar source
- Returns old and new image URLs

#### Actions Layer (`src/server/users/actions.ts`)

```typescript
export async function actionUpdateProfileImage(imageUrl: string);
```

- Server action for client-side mutations
- Delegates to service layer
- Revalidates `/profile/settings` path

#### Upload Handler (`src/app/api/uploadthing/core.ts`)

```typescript
profilePictureUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } });
```

- Validates user authentication in the UploadThing middleware
- Returns old image URL in metadata for potential cleanup
- Max file size: 4MB
- Only 1 file per upload

### UI Component (`src/components/modals/profile-picture-modal.tsx`)

The `ProfilePictureModal` component provides:

- File selection via click or drag-and-drop
- Client-side image resizing using HTML5 Canvas API
- Upload progress tracking
- Save progress simulation
- Error handling and user feedback via toast notifications
- Session update after successful upload

### Image Resizing

Images are resized client-side before upload:

1. User selects an image file
2. File is loaded into HTML5 Canvas
3. Canvas dimensions are calculated to maintain aspect ratio
4. Longest side is capped at 256px
5. Image is redrawn on canvas at new dimensions
6. Canvas is converted to blob with 0.9 quality
7. Resized blob is uploaded to UploadThing

Because uploaded profile pictures are resized to avatar-sized dimensions before upload, they do not require additional runtime optimization when displayed in avatar UI.

## Security

### Permission Controls

- **Middleware**: UploadThing middleware validates user authentication before allowing upload
- **Service Layer**: Session is fetched with `auth.api.getSession({ headers })` to ensure only authenticated users update images
- **Scope**: Users can only update their own profile picture (enforced by session user ID)

### Data Validation

- URL validation using Zod schema in service layer
- Max file size: 4MB
- File type: Images only (enforced by UploadThing)
- URL length: Max 500 characters

## Usage

### Settings Page

Profile picture management is integrated into the account settings page:

```tsx
// src/app/[locale]/(pages)/profile/settings/page.tsx
<ProfilePictureModal currentImageUrl={user?.image ?? null} />
```

### Custom Trigger

The modal can be used with a custom trigger:

```tsx
<ProfilePictureModal
  currentImageUrl={userImage}
  trigger={<button>Change Picture</button>}
  onSuccess={({ url }) => console.log("New image:", url)}
/>
```

## Database Schema

Avatar state is stored in the `users` table:

```typescript
image: d.varchar({ length: 255 });
discordImage: d.varchar("discord_image", { length: 500 });
avatarSource: d.varchar("avatar_source", { length: 16 });
```

`image` remains the custom/legacy value for backwards compatibility. An explicit `discord` source resolves to `discordImage` with `image` as a fallback; `custom` resolves to `image`. For rows created before source tracking, recognized Discord CDN URLs are treated as Discord and other URLs as custom until a source is explicitly saved.

`discordImage` and `avatarSource` are server-owned Better Auth fields and cannot be written through the generic user-update API. Discord OAuth profile mapping refreshes an existing linked user's Discord image, while the post-link server action handles a newly created link. New Discord-authenticated users initialize both fields from the provider image in the user creation hook. Broad provider-profile override remains disabled, so signing in cannot replace a user's custom image or display name. Disconnecting Discord always switches the source to custom but retains the cached Discord URL for a future reconnect.

## Future Improvements

1. **Old Image Cleanup**: Implement automated deletion of old images from UploadThing when a new image is uploaded (Note: UploadThing doesn't provide direct file deletion API in middleware)
2. **Image Cropping**: Add crop functionality before upload
3. **Multiple Sizes**: Generate and store multiple sizes (thumbnail, medium, large)
4. **Image Optimization**: Add additional compression options
5. **Direct Camera Access**: Support taking photos directly from device camera

## Related Files

- `src/server/users/data.ts` - Data layer
- `src/server/users/service.ts` - Service layer with auth
- `src/server/users/actions.ts` - Server actions
- `src/components/modals/profile-picture-modal.tsx` - UI component
- `src/app/[locale]/(pages)/profile/settings/page.tsx` - Settings page
- `src/app/api/uploadthing/core.ts` - Upload configuration

## Inspiration

The ProfilePictureModal design and loading states were inspired by the existing `GearImageModal` component, maintaining consistency with the application's existing patterns and user experience.
