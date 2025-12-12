# Profile Picture Manager

This document describes the profile picture upload and management feature added to the account settings page.

## Overview

Users can upload and manage their profile pictures from the account settings page at `/profile/settings`. Profile pictures are automatically resized to a maximum of 256px on the longest side before upload to ensure optimal performance and storage.

## Features

1. **Profile Picture Upload**: Users can upload images from their device
2. **Automatic Resizing**: Images are resized client-side to max 256px on longest side
3. **Real-time Preview**: Users see their current profile picture with avatar fallback
4. **Progress Indicators**: Upload and save progress are displayed to users
5. **Session Updates**: Profile picture changes are reflected immediately in the user session

## Implementation

### Architecture

The implementation follows the standard Sharply server structure:

```
data/ → service/ → actions/ → UI component
```

#### Data Layer (`src/server/users/data.ts`)

```typescript
export async function updateUserImage(userId: string, imageUrl: string)
```

Raw database write to update the user's image field.

#### Service Layer (`src/server/users/service.ts`)

```typescript
export async function updateProfileImage(imageUrl: string)
```

- Validates the user is authenticated using `requireUser()`
- Validates the image URL format
- Retrieves old image URL for potential cleanup
- Calls data layer to update user image
- Returns old and new image URLs

#### Actions Layer (`src/server/users/actions.ts`)

```typescript
export async function actionUpdateProfileImage(imageUrl: string)
```

- Server action for client-side mutations
- Delegates to service layer
- Revalidates `/profile/settings` path

#### Upload Handler (`src/app/(app)/api/uploadthing/core.ts`)

```typescript
profilePictureUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
```

- Validates user authentication in middleware
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

## Security

### Permission Controls

- **Middleware**: UploadThing middleware validates user authentication before allowing upload
- **Service Layer**: `requireUser()` ensures only authenticated users can update profile images
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
// src/app/(app)/(pages)/profile/settings/page.tsx
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

The profile picture URL is stored in the `users` table:

```typescript
image: d.varchar({ length: 255 })
```

This field is also used by NextAuth for OAuth provider profile images.

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
- `src/app/(app)/(pages)/profile/settings/page.tsx` - Settings page
- `src/app/(app)/api/uploadthing/core.ts` - Upload configuration

## Inspiration

The ProfilePictureModal design and loading states were inspired by the existing `GearImageModal` component, maintaining consistency with the application's existing patterns and user experience.
