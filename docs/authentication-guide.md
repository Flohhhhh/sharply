# Authentication Guide

This guide shows how to work with authentication in Sharply using Better Auth (configured in `src/auth.ts`) across server components, client components, and API routes.

## Overview

- Better Auth is initialized in `src/auth.ts` with the Drizzle adapter.
- Client helpers (including `useSession`) are exported from `src/lib/auth/auth-client.ts`.
- Shared role helper (`requireRole`) lives in `src/lib/auth/auth-helpers.ts` and is safe to use in both server and client code (pure runtime check, no server APIs).
- Server session helper `getSessionOrThrow` is exported from `~/server/auth` (wraps `auth.api.getSession` with `headers` and throws 401 when missing).

## Server Components and API Routes

### Getting the session

Use `getSessionOrThrow` (wraps `auth.api.getSession` with request headers). For custom handling (e.g., allow anonymous), call `auth.api.getSession` directly and branch on null.

```tsx
import { auth } from "~/auth";
import { headers } from "next/headers";
import { getSessionOrThrow } from "~/server/auth";

export default async function ServerComponent() {
  const session = await getSessionOrThrow();
  const user = session?.user;

  if (!session) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {user?.name ?? "Sharply user"}!</div>;
}
```

### Role and permission checks

Use the shared helpers to enforce authentication and roles:

```tsx
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { headers } from "next/headers";
import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";

export default async function ProtectedPage() {
  const session = await getSessionOrThrow();

  if (!session || !requireRole(session.user, ["EDITOR"])) {
    redirect("/auth/signin");
  }

  return <div>Editor-only content</div>;
}

// If you just need the user and want an error on missing auth:
// const session = await getSessionOrThrow();
```

### API route pattern

```tsx
import { NextResponse } from "next/server";
import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";

export async function POST() {
  const session = await getSessionOrThrow();

  if (!requireRole(session.user, ["ADMIN"])) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  // ...handle request
  return NextResponse.json({ ok: true });
}
```

## Client Components

### Getting the session

Use the Better Auth client hook:

```tsx
"use client";

import { useSession } from "~/lib/auth/auth-client";

export function ClientComponent() {
  const { data, isPending, error } = useSession();
  const session = data?.session;

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Authentication error</div>;
  if (!session) return <div>Please sign in</div>;

  return <div>Welcome, {session.user.name ?? "Sharply user"}!</div>;
}
```

### Conditional rendering

```tsx
export function ConditionalComponent() {
  const { data } = useSession();
  const session = data?.session;

  return session ? (
    <div>Welcome back, {session.user.name ?? "friend"}!</div>
  ) : (
    <div>Please sign in to continue</div>
  );
}
```

## Session Types

Better Auth exports types you can import from `~/auth`:

```ts
import type { AuthSession, AuthUser, UserRole } from "~/auth";
```

Shape (simplified):

```ts
type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole; // USER | MODERATOR | EDITOR | ADMIN | SUPERADMIN
  memberNumber?: number | null;
  inviteId?: string | null;
  socialLinks?: unknown[]; // JSON array stored on the user
};

type AuthSession = {
  user: AuthUser;
  expires: string;
};
```

## Sign-in / Sign-out (client)

```tsx
import { signIn, signOut } from "~/lib/auth/auth-client";

// OAuth sign-in with redirect you control
const { data, error } = await signIn.social({
  provider: "discord",
  callbackURL: "/dashboard",
  disableRedirect: true,
});
if (!error) {
  window.location.href = data.url ?? "/dashboard";
}

// Email OTP (if enabled)
// const { error } = await emailOtp.sendVerificationOtp({ email, type: "sign-in" });

// Sign out
await signOut({ callbackURL: "/" });
```

## Protected layout pattern

```tsx
// src/app/(app)/(protected)/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { headers } from "next/headers";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <>{children}</>;
}
```

## Troubleshooting

1. **Session is always null** – ensure `headers` are passed to `auth.api.getSession` on the server and that the request includes cookies.
2. **Client errors** – confirm components using `useSession` are client components and that Better Auth client is initialized via `src/lib/auth/auth-client.ts`.
3. **Role checks failing** – verify the user object includes `role` and that `requireRole` receives the user (not the entire session).

## Best Practices

1. Always derive `session` with `auth.api.getSession({ headers })` on the server (or `getSessionOrThrow` when you want a thrown 401).
2. Keep role checks in services/guards; do not put DB access in client components.
3. Handle `isPending` and `error` states when using `useSession` on the client.
4. Redirect unauthenticated users early in server components/layouts.
5. Import types from `~/auth` to keep user/session typing consistent.
