# Image Request Feature - Code Structure

## Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Gear Detail Page                         │
│              (src/app/.../gear/[slug]/page.tsx)             │
│                                                              │
│  - Fetches hasImageRequest status from service layer        │
│  - Passes to GearImageCarousel component                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  GearImageCarousel                          │
│      (src/app/.../gear/_components/                         │
│               gear-image-carousel.tsx)                      │
│                                                              │
│  - Shows images if available                                │
│  - Shows RequestImageButton if no images                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               RequestImageButton (Client)                    │
│      (src/app/.../gear/_components/                         │
│              request-image-button.tsx)                      │
│                                                              │
│  - Manages button state                                     │
│  - Calls actionToggleImageRequest                           │
│  - Shows toast notifications                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Server Actions Layer                            │
│           (src/server/gear/actions.ts)                      │
│                                                              │
│  actionToggleImageRequest(slug, action)                     │
│  - Calls toggleImageRequest service                         │
│  - Revalidates gear page cache                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Service Layer                                │
│           (src/server/gear/service.ts)                      │
│                                                              │
│  toggleImageRequest(slug, action)                           │
│  - Gets user session                                        │
│  - Resolves gear ID                                         │
│  - Calls data layer functions                               │
│  - Tracks analytics                                         │
│                                                              │
│  fetchImageRequestStatus(slug)                              │
│  - Checks if user has requested                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Layer                                  │
│             (src/server/gear/data.ts)                       │
│                                                              │
│  - hasImageRequest(gearId, userId)                          │
│  - addImageRequest(gearId, userId)                          │
│  - removeImageRequest(gearId, userId)                       │
│  - fetchAllImageRequests()                                  │
│                                                              │
│  Direct database operations using Drizzle ORM               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database                                  │
│              (PostgreSQL + Drizzle ORM)                     │
│                                                              │
│  app.image_requests table:                                  │
│  - user_id (PK, FK to users)                                │
│  - gear_id (PK, FK to gear)                                 │
│  - created_at                                               │
└─────────────────────────────────────────────────────────────┘
```

## Admin Analytics Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Admin Analytics Page                            │
│        (src/app/.../admin/analytics/page.tsx)               │
│                                                              │
│  Renders ImageRequestsList component                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            ImageRequestsList (Server)                        │
│     (src/app/.../admin/analytics/                           │
│              image-requests-list.tsx)                       │
│                                                              │
│  - Calls fetchAllImageRequests() from data layer            │
│  - Displays aggregated request data                         │
│  - Shows request count, gear name, last request date        │
│  - Links to gear pages                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Layer                                  │
│             (src/server/gear/data.ts)                       │
│                                                              │
│  fetchAllImageRequests()                                    │
│  - Aggregates requests by gear item                         │
│  - Counts total requests per item                           │
│  - Sorts by request count and date                          │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### Security
- ✅ Users must be authenticated to request images
- ✅ Session validation in service layer
- ✅ Database constraints prevent duplicate requests

### User Experience
- ✅ Toast notifications for all actions
- ✅ Loading states during API calls
- ✅ Different button states (Request vs Requested)
- ✅ Button hidden for non-authenticated users

### Admin Features
- ✅ See all image requests in one place
- ✅ Sorted by popularity (request count)
- ✅ Quick links to gear pages
- ✅ User-friendly date formatting

### Architecture
- ✅ Follows project's 3-layer pattern (data → service → actions)
- ✅ Server-side rendering where appropriate
- ✅ Client components only where needed (button interactions)
- ✅ Proper revalidation after mutations
