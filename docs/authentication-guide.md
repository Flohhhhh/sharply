# Authentication Guide

This guide covers how to use authentication throughout the Sharply application, including server components, client components, and API routes.

## Overview

Sharply uses NextAuth.js v5 with Discord as the primary authentication provider. The authentication is configured in `src/server/auth/config.ts` and exported through `src/server/auth/index.ts`.

## Server Components

### Getting User Session

Use the `auth()` function from the server auth module:

```tsx
import { auth } from "~/server/auth";

export default async function ServerComponent() {
  const session = await auth();

  if (!session?.user) {
    // User is not authenticated
    return <div>Please sign in</div>;
  }

  // User is authenticated
  return <div>Welcome, {session.user.name}!</div>;
}
```

### Session Object Structure

```tsx
interface Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
}
```

### Redirecting Unauthenticated Users

```tsx
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function ProtectedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return <div>Protected content</div>;
}
```

## Client Components

### Getting User Session

Use the `useSession` hook from `next-auth/react`:

```tsx
"use client";

import { useSession } from "next-auth/react";

export function ClientComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {session?.user?.name}!</div>;
}
```

### Session Status Values

- `"loading"` - Session is being fetched
- `"authenticated"` - User is signed in
- `"unauthenticated"` - User is not signed in

### Conditional Rendering

```tsx
export function ConditionalComponent() {
  const { data: session } = useSession();

  return (
    <div>
      {session ? (
        <div>Welcome back, {session.user.name}!</div>
      ) : (
        <div>Please sign in to continue</div>
      )}
    </div>
  );
}
```

## API Routes

### Getting User Session

Use the `auth()` function in API routes:

```tsx
import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  // User is authenticated, proceed with request
  const userId = session.user.id;
  // ... handle request
}
```

### Error Responses

```tsx
// Unauthorized
return NextResponse.json({ error: "Authentication required" }, { status: 401 });

// Forbidden (user authenticated but lacks permission)
return NextResponse.json(
  { error: "Insufficient permissions" },
  { status: 403 },
);
```

## Authentication Actions

### Sign In

```tsx
// In client components
import { signIn } from "next-auth/react";

// Sign in with specific provider
<button onClick={() => signIn("discord")}>
  Sign in with Discord
</button>

// Sign in with redirect
<button onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}>
  Sign in and redirect
</button>

// In server components (redirect)
import { redirect } from "next/navigation";
redirect("/api/auth/signin");
```

### Sign Out

```tsx
// In client components
import { signOut } from "next-auth/react";

<button onClick={() => signOut()}>
  Sign out
</button>

// Sign out with redirect
<button onClick={() => signOut({ callbackUrl: "/" })}>
  Sign out and go home
</button>
```

### Sign In/Out Links

```tsx
// Simple anchor tags for server-side rendering
<a href="/api/auth/signin">Sign In</a>
<a href="/api/auth/signout">Sign Out</a>
```

## Protected Routes

### Route Protection Pattern

```tsx
// src/app/(protected)/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return <div>{children}</div>;
}
```

### Conditional Protection

```tsx
export default async function ConditionalPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div>
        <h1>Sign in required</h1>
        <a href="/api/auth/signin">Sign in to continue</a>
      </div>
    );
  }

  return <div>Protected content</div>;
}
```

## User Data Access

### Current User ID

```tsx
// Server component
const session = await auth();
const userId = session?.user?.id;

// Client component
const { data: session } = useSession();
const userId = session?.user?.id;
```

### User Profile Information

```tsx
const session = await auth();
const user = session?.user;

if (user) {
  console.log("User ID:", user.id);
  console.log("Name:", user.name);
  console.log("Email:", user.email);
  console.log("Avatar:", user.image);
}
```

## Common Patterns

### Loading States

```tsx
export function UserProfile() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading user profile...</div>;
  }

  if (!session) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {session.user.name}!</div>;
}
```

### Conditional Features

```tsx
export function FeatureToggle() {
  const { data: session } = useSession();

  return (
    <div>
      {session ? (
        <button>Use Premium Feature</button>
      ) : (
        <a href="/api/auth/signin">Sign in for Premium</a>
      )}
    </div>
  );
}
```

### User-Specific Data

```tsx
export async function UserData() {
  const session = await auth();

  if (!session?.user?.id) {
    return <div>Sign in to view your data</div>;
  }

  // Fetch user-specific data using session.user.id
  const userData = await fetchUserData(session.user.id);

  return <div>{/* Render user data */}</div>;
}
```

## Troubleshooting

### Common Issues

1. **"auth is not a function"** - Make sure you're importing from `~/server/auth`, not `next-auth`
2. **Session always null** - Check that your auth configuration is correct
3. **Client component auth errors** - Ensure the component is wrapped in `SessionProvider`

### Debug Tips

```tsx
// Add logging to debug session issues
const session = await auth();
console.log("Session:", session);
console.log("User:", session?.user);
```

## Best Practices

1. **Always check session existence** before accessing user data
2. **Use appropriate HTTP status codes** in API responses
3. **Handle loading states** gracefully in client components
4. **Protect sensitive routes** at the layout level when possible
5. **Cache auth calls** in server components to avoid repeated database queries
