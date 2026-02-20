# Manually Triggered Infinitely Scrolling Pagination Hybrid

## Overview

The `/browse` page uses a hybrid pagination approach that combines manual "Load More" button clicks with automatic infinite scrolling. This method provides the best of both worlds: user control and seamless browsing experience.

## How It Works

### Initial State
- Users start by seeing the first page of results (server-side rendered)
- A "Load More" button appears at the bottom if more results are available

### Desktop Behavior (Primary Use Case)
1. **Manual Trigger**: User clicks "Load More" button
2. **Infinite Scroll Activation**: After clicking, automatic scrolling is enabled
3. **Auto-Loading**: Next 5 pages load automatically as user scrolls down
4. **Auto-Load Limit**: After 5 automatic loads, infinite scrolling stops
5. **Manual Resume**: "Load More" button reappears, user can click to continue
6. **Cycle Repeats**: Clicking the button resets the auto-load counter and enables infinite scrolling again

### Mobile Behavior
- Infinite scrolling is **disabled** on mobile devices
- Only manual "Load More" button clicks are used
- Provides better control and prevents excessive data usage

## Technical Implementation

### Key Components

**Component**: `BrowseResultsGrid` (`browse/_components/browse-results-grid.tsx`)
- Uses `useSWRInfinite` for data fetching
- Manages infinite scroll state and auto-load counter
- Uses Intersection Observer API for scroll detection

**API Route**: `/api/gear/browse` (`api/gear/browse/route.ts`)
- Handles paginated data requests
- Returns pages with `hasMore` flag
- Supports both "list" and "feed" views

### Configuration

```typescript
const MAX_AUTO_SCROLL_LOADS = 5; // Maximum automatic page loads before requiring manual trigger
```

### State Management

- `infiniteActive`: Boolean flag controlling whether infinite scroll is enabled
- `autoScrollLoads`: Counter tracking how many pages have auto-loaded in current cycle
- `sentinelRef`: DOM reference for intersection observer target
- `loadingRef`: Prevents duplicate load requests during fetch operations

### Intersection Observer

```typescript
const observer = new IntersectionObserver(
  (entries) => {
    if (entry.isIntersecting && !loadingRef.current) {
      // Increment counter and load next page
      // Disable infinite scroll if limit reached
    }
  },
  { rootMargin: "200px 0px" } // Triggers 200px before reaching sentinel
);
```

## Benefits

### User Experience
- **Progressive Enhancement**: Start with simple pagination, upgrade to infinite scroll
- **Performance Control**: Limits automatic data loading to prevent overwhelming
- **User Agency**: Users explicitly choose when to load more content
- **Mobile Optimization**: Simpler behavior on mobile devices

### Technical Advantages
- **Memory Management**: Prevents loading entire dataset at once
- **Server Load**: Distributes requests over time
- **Network Efficiency**: Respects user bandwidth, especially on mobile
- **SEO Friendly**: Initial server-rendered content is crawlable

## Flow Diagram

```
[Initial Page Loaded]
        ↓
[Show "Load More" Button]
        ↓
[User Clicks Button]
        ↓
[Desktop: Enable Infinite Scroll | Mobile: Load Single Page]
        ↓ (Desktop only)
[Auto-load pages 1-5 as user scrolls]
        ↓
[Reach limit? Disable infinite scroll]
        ↓
[Show "Load More" Button Again]
        ↓
[User Clicks → Reset counter → Repeat]
```

## User Journey Example

1. User lands on `/browse/canon/lenses`
2. Sees first 12 results + "Load More" button
3. Clicks "Load More"
4. Scrolls down, next 5 pages (60 more items) load automatically
5. Reaches end of auto-load, sees "Load More" button again
6. Clicks button to continue browsing
7. Process repeats indefinitely

## Design Philosophy

This approach balances:
- **Discoverability**: Users can easily browse deep into results
- **Performance**: Controlled loading prevents resource exhaustion
- **Intent**: Users signal desire for more content before getting it
- **Context**: Desktop users get enhanced experience, mobile stays simple
- **Sustainability**: Server and client resources are respected
