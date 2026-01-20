# Image Request Feature - Code Examples

## Key Code Snippets

### 1. Database Schema (schema.ts)
```typescript
export const imageRequests = appSchema.table(
  "image_requests",
  (d) => ({
    userId: d
      .varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gearId: d
      .varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    createdAt,
  }),
  (t) => [
    primaryKey({ columns: [t.userId, t.gearId] }), // Ensures one request per user per item
    index("image_request_gear_idx").on(t.gearId),
  ],
);
```

### 2. Data Layer (data.ts)
```typescript
// Check if user has requested
export async function hasImageRequest(gearId: string, userId: string): Promise<boolean> {
  const row = await db
    .select({ userId: imageRequests.userId })
    .from(imageRequests)
    .where(and(eq(imageRequests.userId, userId), eq(imageRequests.gearId, gearId)))
    .limit(1);
  return row.length > 0;
}

// Add request
export async function addImageRequest(gearId: string, userId: string) {
  const exists = await db
    .select({ userId: imageRequests.userId })
    .from(imageRequests)
    .where(and(eq(imageRequests.userId, userId), eq(imageRequests.gearId, gearId)))
    .limit(1);
  if (exists.length > 0) return { alreadyExists: true } as const;

  await db.insert(imageRequests).values({ userId, gearId });
  return { added: true, alreadyExists: false } as const;
}

// Fetch all for admin
export async function fetchAllImageRequests() {
  return db
    .select({
      gearId: imageRequests.gearId,
      gearName: gear.name,
      gearSlug: gear.slug,
      requestCount: sql<number>`count(*)`,
      latestRequestDate: sql<Date>`max(${imageRequests.createdAt})`,
    })
    .from(imageRequests)
    .leftJoin(gear, eq(imageRequests.gearId, gear.id))
    .groupBy(imageRequests.gearId, gear.name, gear.slug)
    .orderBy(sql`count(*) desc, max(${imageRequests.createdAt}) desc`);
}
```

### 3. Service Layer (service.ts)
```typescript
export async function toggleImageRequest(slug: string, action: "add" | "remove") {
  const { user } = await getSessionOrThrow(); // Auth check
  const userId = user.id;
  const gearId = await resolveGearIdOrThrow(slug);
  
  if (action === "add") {
    const res = await addImageRequest(gearId, userId);
    if (res.alreadyExists)
      return { ok: false, reason: "already_requested" } as const;
    
    await track("image_request_toggle", { slug, action: "add" }); // Analytics
    return { ok: true, action: "added" as const };
  }
  
  await removeImageRequest(gearId, userId);
  await track("image_request_toggle", { slug, action: "remove" });
  return { ok: true, action: "removed" as const };
}

export async function fetchImageRequestStatus(slug: string) {
  const { user } = await getSessionOrThrow();
  const userId = user.id;
  const gearId = await resolveGearIdOrThrow(slug);
  const hasRequested = await hasImageRequest(gearId, userId);
  return { hasRequested };
}
```

### 4. Server Action (actions.ts)
```typescript
export async function actionToggleImageRequest(
  slug: string,
  action: "add" | "remove",
) {
  const res = await toggleImageRequest(slug, action);
  revalidatePath(`/gear/${slug}`); // Cache invalidation
  return res;
}
```

### 5. Request Button Component (request-image-button.tsx)
```typescript
"use client";

export function RequestImageButton({ slug, initialHasRequested }: Props) {
  const [hasRequested, setHasRequested] = useState(initialHasRequested ?? false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const action = hasRequested ? "remove" : "add";
      const result = await actionToggleImageRequest(slug, action);

      if (result.ok) {
        if (result.action === "added") {
          setHasRequested(true);
          toast.success("Image request submitted", {
            description: "Thanks for your interest!",
          });
        } else {
          setHasRequested(false);
          toast.success("Image request removed");
        }
      }
    } catch (error) {
      toast.error("Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={hasRequested ? "outline" : "default"}
      icon={hasRequested ? <Check /> : <ImagePlus />}
    >
      {hasRequested ? "Image Requested" : "Request Image"}
    </Button>
  );
}
```

### 6. Gear Page Integration (page.tsx)
```typescript
export default async function GearPage({ params }: GearPageProps) {
  const { slug } = await params;
  const item = await fetchGearBySlug(slug);

  // Fetch image request status for current user
  let hasImageRequest: boolean | null = null;
  try {
    const { fetchImageRequestStatus } = await import("~/server/gear/service");
    const status = await fetchImageRequestStatus(slug).catch(() => null);
    hasImageRequest = status ? status.hasRequested : null;
  } catch {
    hasImageRequest = null; // User not logged in
  }

  return (
    <GearImageCarousel
      name={item.name}
      thumbnailUrl={item.thumbnailUrl}
      topViewUrl={item.topViewUrl}
      slug={slug}
      hasImageRequest={hasImageRequest}
    />
  );
}
```

### 7. Admin Analytics List (image-requests-list.tsx)
```typescript
export async function ImageRequestsList() {
  const requests = await fetchAllImageRequests();

  return (
    <div className="space-y-2">
      {requests.map((request) => (
        <div key={request.gearId} className="flex items-center justify-between border p-4">
          <div>
            <Link href={`/gear/${request.gearSlug}`}>
              {request.gearName}
            </Link>
            <div className="text-sm text-muted-foreground">
              {request.requestCount} {request.requestCount === 1 ? "request" : "requests"}
              {" · "}
              Last request {formatDistanceToNow(new Date(request.latestRequestDate))}
            </div>
          </div>
          <Link href={`/gear/${request.gearSlug}`}>View Item →</Link>
        </div>
      ))}
    </div>
  );
}
```

## Testing Checklist

- [ ] Run `npm run db:push` to create the table
- [ ] Visit a gear page without an image while logged in
- [ ] Click "Request Image" button
- [ ] Verify success toast appears
- [ ] Verify button changes to "Image Requested"
- [ ] Click again to remove request
- [ ] Verify removal toast appears
- [ ] Visit `/admin/analytics` as admin
- [ ] Verify the request appears in the list
- [ ] Verify request count is accurate
- [ ] Verify clicking "View Item →" navigates to gear page
