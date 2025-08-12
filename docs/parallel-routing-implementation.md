# Parallel Routing Modal Implementation

## Overview

This document describes the implementation of the parallel routing modal system for the gear editing functionality, following the Next.js documentation patterns.

## File Structure

```
app/(pages)/gear/[slug]/
├── page.tsx                    # Main gear page with "Suggest Edit" buttons
├── layout.tsx                  # Layout that renders children + edit slot
├── edit/
│   └── page.tsx               # Full edit page (mobile/direct navigation)
└── @edit/
    ├── default.tsx             # Returns null when modal not active
    └── (.)edit/
        └── page.tsx            # Modal intercept for /edit route
```

## How It Works

### Desktop Experience (Route Intercepting)

1. User clicks "Suggest Edit" button
2. Navigates to `/gear/[slug]/edit`
3. `@edit` slot intercepts the route
4. Modal opens with `(.)edit/page.tsx` content
5. User stays in context of the gear page

### Mobile Experience (Full Page Navigation)

1. User clicks "Suggest Edit" button
2. Navigates to `/gear/[slug]/edit`
3. Full edit page renders (no modal)
4. Standard browser navigation

### Fallback Behavior

- If JavaScript is disabled, modal gracefully degrades to full page
- Direct navigation to `/edit` always works
- Modal state is preserved in URL

## Key Components

### EditGearModal

- Uses shadcn Dialog component
- Handles modal open/close via router.back()
- Responsive design with max-width and scroll

### EditGearForm

- Shared form component used in both modal and full page
- Basic form fields for gear specifications
- Form validation and submission handling

### Layout Integration

- `layout.tsx` renders both `children` and `edit` slot
- Modal appears alongside main content on desktop
- Clean separation of concerns

## Usage

### Adding Edit Buttons

The gear page has two "Suggest Edit" buttons:

1. **Primary button** above specifications (prominent placement)
2. **Secondary button** in specifications header (contextual placement)

### Navigation

- Clicking buttons navigates to `/gear/[slug]/edit`
- Modal opens automatically on desktop
- Full page loads on mobile
- Browser back button closes modal

## Benefits

1. **Progressive Enhancement** - Works everywhere, better on desktop
2. **SEO Friendly** - Edit pages are crawlable and shareable
3. **Accessibility** - Modal can have proper focus management
4. **User Experience** - Desktop users stay in context
5. **Developer Experience** - Single codebase for both experiences

## Future Enhancements

- Add loading states for modal
- Implement form validation
- Add custom input components for photography specs
- Integrate with gear proposal system
- Add keyboard shortcuts for modal interaction
