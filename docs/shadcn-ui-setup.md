# shadcn/ui Setup Guide

This document explains how shadcn/ui has been set up in your project and how to use it.

## What is shadcn/ui?

shadcn/ui is a collection of reusable components built on top of Tailwind CSS and Radix UI. It provides a set of accessible, customizable, and beautiful components that you can copy and paste into your apps.

## Setup Status ✅

shadcn/ui has been successfully initialized in your project with the following configuration:

- **Style**: New York (modern, clean design)
- **Base Color**: Gray
- **Framework**: Next.js 15 with App Router
- **Tailwind CSS**: v4 with CSS variables
- **TypeScript**: Full TypeScript support
- **Icons**: Lucide React

## Installed Components

The following components have been installed and are ready to use:

- **Button** (`src/components/ui/button.tsx`) - Various button variants and styles
- **Card** (`src/components/ui/card.tsx`) - Content containers with header, content, and footer
- **Input** (`src/components/ui/input.tsx`) - Form input fields
- **Badge** (`src/components/ui/badge.tsx`) - Small status indicators
- **Avatar** (`src/components/ui/avatar.tsx`) - User profile images with fallbacks

## Project Structure

```
src/
├── components/
│   └── ui/                    # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       ├── avatar.tsx
│       └── example-usage.tsx  # Demo component
├── lib/
│   └── utils.ts               # Utility functions (cn helper)
└── styles/
    └── globals.css            # Tailwind CSS with shadcn/ui variables
```

## Configuration Files

- **`components.json`** - shadcn/ui configuration
- **`src/styles/globals.css`** - CSS variables and Tailwind configuration
- **`src/lib/utils.ts`** - Utility functions including the `cn` helper

## How to Use Components

### Basic Usage

```tsx
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

### Using the `cn` Utility

The `cn` utility function helps merge Tailwind CSS classes efficiently:

```tsx
import { cn } from "~/lib/utils";

// Merge classes with conditional logic
<div
  className={cn(
    "base-classes",
    isActive && "active-classes",
    variant === "primary" ? "primary-classes" : "secondary-classes",
  )}
>
  Content
</div>;
```

## Adding More Components

To add additional shadcn/ui components, use the CLI:

```bash
npx shadcn@latest add [component-name]
```

Available components include:

- `dialog` - Modal dialogs
- `dropdown-menu` - Dropdown menus
- `form` - Form components with validation
- `table` - Data tables
- `tabs` - Tabbed interfaces
- `toast` - Notification toasts
- And many more...

## Demo Page

Visit `/ui-demo` in your application to see all the installed components in action.

## Customization

### Colors

The color scheme is defined in `src/styles/globals.css` using CSS variables. You can customize:

- Primary colors
- Secondary colors
- Background colors
- Border colors
- And more...

### Component Variants

Most components support multiple variants. For example, buttons have:

- `default` - Primary button
- `secondary` - Secondary button
- `destructive` - Danger/error button
- `outline` - Outlined button
- `ghost` - Minimal button
- `link` - Link-style button

### Styling

All components use Tailwind CSS classes and can be customized by:

- Adding custom classes
- Modifying the component source code
- Using the `cn` utility to merge classes

## Best Practices

1. **Import from `~/components/ui`** - Use the configured alias
2. **Use the `cn` utility** - For conditional or dynamic classes
3. **Follow the component API** - Don't modify component internals unless necessary
4. **Customize with variants** - Use built-in variants before creating custom ones
5. **Maintain accessibility** - Components are built with accessibility in mind

## Troubleshooting

### Common Issues

1. **TypeScript errors**: Make sure you're importing from the correct path
2. **Styling not working**: Check that Tailwind CSS is properly configured
3. **Component not found**: Verify the component was installed with `npx shadcn@latest add`

### Getting Help

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)

## Next Steps

1. Explore the demo page at `/ui-demo`
2. Start using components in your existing pages
3. Add more components as needed
4. Customize the design system to match your brand
5. Build your UI components library

Happy coding! 🎉
