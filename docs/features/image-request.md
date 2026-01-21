# Image Request Feature

## Overview
This feature allows users to request images for gear items that don't have photos. It helps prioritize which items need images the most based on user interest.

## User Flow

### For Regular Users
1. When viewing a gear item without an image, users see a "Request Image" button
2. Clicking the button submits a request and shows a success toast
3. The button changes to "Image Requested" with a checkmark icon
4. Users can click again to remove their request

### For Admins
1. Navigate to `/admin/analytics`
2. View the "Image Requests" section at the top
3. See all gear items with pending image requests
4. Items are sorted by:
   - Number of requests (descending)
   - Most recent request date (descending)
5. Click "View Item →" to navigate to the gear page

## Technical Implementation

### Database Schema
- **Table**: `app.image_requests`
- **Columns**:
  - `user_id` (varchar, FK to users)
  - `gear_id` (varchar, FK to gear)
  - `created_at` (timestamp)
- **Constraints**:
  - Primary key: `(user_id, gear_id)` - ensures one request per user per item
  - Index on `gear_id` for efficient queries

### API Structure

#### Data Layer (`src/server/gear/data.ts`)
- `hasImageRequest(gearId, userId)` - Check if request exists
- `addImageRequest(gearId, userId)` - Create a request
- `removeImageRequest(gearId, userId)` - Remove a request
- `fetchAllImageRequests()` - Get aggregated requests for admin

#### Service Layer (`src/server/gear/service.ts`)
- `fetchImageRequestStatus(slug)` - Get user's request status
- `toggleImageRequest(slug, action)` - Add/remove request with validation

#### Server Actions (`src/server/gear/actions.ts`)
- `actionToggleImageRequest(slug, action)` - Client-callable action with revalidation

### UI Components

#### Request Image Button
- **Location**: `src/app/(app)/(pages)/gear/_components/request-image-button.tsx`
- **Features**:
  - Loading state during API call
  - Toast notifications for success/error
  - Different states: "Request Image" vs "Image Requested"
  - Only shown to logged-in users

#### Admin Analytics
- **Location**: `src/app/(app)/(admin)/admin/analytics/image-requests-list.tsx`
- **Features**:
  - Displays gear name, request count, and last request date
  - Links to gear pages
  - Uses date-fns for friendly date formatting

## Usage

### Running Migrations
After pulling this feature, run:
```bash
npm run db:push
```

This will create the `image_requests` table in your database.

### Testing the Feature
1. Navigate to a gear item without an image (e.g., `/gear/[slug]`)
2. Log in as a user
3. Click "Request Image" button
4. Verify toast appears
5. Refresh page - button should show "Image Requested"
6. As admin, check `/admin/analytics` to see the request

## Notes
- Users must be authenticated to request images
- The button is hidden for non-authenticated users
- Database constraint prevents duplicate requests
- Analytics tracking is integrated for request/unrequest actions
