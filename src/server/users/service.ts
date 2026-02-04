import "server-only";

import { auth, type AuthUser } from "~/auth";
import { z } from "zod";
import { eq, sql, and } from "drizzle-orm";
import { db } from "~/server/db";
import {
  brands,
  fixedLensSpecs,
  gear,
  gearMounts,
  lensSpecs,
  mounts,
  reviews,
  users,
  wishlists,
  ownerships,
  notifications,
} from "~/server/db/schema";
import { updateUserImage, updateUserSocialLinks } from "./data";
import { createNotificationData } from "../notifications/data";
import type { GearItem, Mount } from "~/types/gear";
import { headers } from "next/headers";
import { getSessionOrThrow } from "~/server/auth";
import { fetchGearAliasesByGearIds } from "~/server/gear/data";

export async function getUserReviews(userId: string) {
  const rows = await db
    .select({
      id: reviews.id,
      content: reviews.content,
      status: reviews.status,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      gearId: gear.id,
      gearSlug: gear.slug,
      gearName: gear.name,
      gearType: gear.gearType,
      brandName: brands.name,
    })
    .from(reviews)
    .leftJoin(gear, eq(reviews.gearId, gear.id))
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .where(eq(reviews.createdById, userId))
    .orderBy(reviews.createdAt);

  const gearIds = rows
    .map((row) => row.gearId)
    .filter((id): id is string => Boolean(id));
  const aliasesById = await fetchGearAliasesByGearIds(gearIds);

  return rows.map((row) => ({
    ...row,
    regionalAliases: row.gearId ? (aliasesById.get(row.gearId) ?? []) : [],
  }));
}

export async function fetchCurrentUserReviews() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return [] as Awaited<ReturnType<typeof getUserReviews>>;
  }

  return getUserReviews(session.user.id);
}

export async function fetchUserById(userId: string) {
  const row = await db
    .select({
      id: users.id,
      name: users.name,
      handle: users.handle,
      email: users.email,
      image: users.image,
      memberNumber: users.memberNumber,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row[0] ?? null;
}

export async function fetchFullUserById(
  userId: string,
): Promise<AuthUser | null> {
  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row[0] as AuthUser | null;
}

type UserGearRelationshipTable = typeof wishlists | typeof ownerships;

async function fetchGearItemsForUserList(
  relationshipTable: UserGearRelationshipTable,
  userId: string,
): Promise<GearItem[]> {
  const rows = await db
    .select()
    .from(relationshipTable)
    .innerJoin(gear, eq(relationshipTable.gearId, gear.id))
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(lensSpecs, eq(lensSpecs.gearId, gear.id))
    .leftJoin(fixedLensSpecs, eq(fixedLensSpecs.gearId, gear.id))
    .where(eq(relationshipTable.userId, userId));

  if (!rows.length) return [];

  const gearIdentifiers = rows.map((row) => row.gear.id);
  const mountRows = gearIdentifiers.length
    ? await db
        .select({
          gearId: gearMounts.gearId,
          mount: mounts,
        })
        .from(gearMounts)
        .leftJoin(mounts, eq(gearMounts.mountId, mounts.id))
        .where(
          sql`${gearMounts.gearId} IN (${sql.join(
            gearIdentifiers.map((gearId) => sql`${gearId}`),
            sql`, `,
          )})`,
        )
    : [];

  const mountsByGearId = new Map<string, Mount[]>();
  for (const mountRow of mountRows) {
    if (!mountRow.mount) continue;
    const existingMounts = mountsByGearId.get(mountRow.gearId) ?? [];
    existingMounts.push(mountRow.mount);
    mountsByGearId.set(mountRow.gearId, existingMounts);
  }

  const items = rows.map((row) => {
    const gearRecord = row.gear;
    const gearMountsForItem = mountsByGearId.get(gearRecord.id) ?? [];
    const mountIdentifierList =
      gearMountsForItem.length > 0
        ? gearMountsForItem.map((mountEntry) => mountEntry.id)
        : gearRecord.mountId
          ? [gearRecord.mountId]
          : null;
    return {
      ...gearRecord,
      brands: row.brands ?? null,
      mounts: gearMountsForItem[0] ?? null,
      mountIds: mountIdentifierList,
      lensSpecs: row.lens_specs ?? null,
      fixedLensSpecs: row.fixed_lens_specs ?? null,
    };
  });

  const aliasesById = await fetchGearAliasesByGearIds(
    items.map((item) => item.id),
  );

  return items.map((item) => ({
    ...item,
    regionalAliases: aliasesById.get(item.id) ?? [],
  }));
}

export async function fetchUserWishlistItems(
  userId: string,
): Promise<GearItem[]> {
  return fetchGearItemsForUserList(wishlists, userId);
}

export async function fetchUserOwnedItems(userId: string): Promise<GearItem[]> {
  return fetchGearItemsForUserList(ownerships, userId);
}

export async function fetchUsersWithAnniversaryToday(): Promise<
  { id: string }[]
> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      sql`to_char(${users.emailVerified}, 'MM-DD') = to_char(now(), 'MM-DD')`,
    );
  return rows;
}

const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Display name must be at least 2 characters")
  .max(50, "Display name must be at most 50 characters");

export async function updateDisplayName(rawName: string) {
  const { user } = await getSessionOrThrow();
  const name = displayNameSchema.parse(rawName);
  await db.update(users).set({ name }).where(eq(users.id, user.id));
  return { ok: true as const, name };
}

const profileImageSchema = z
  .string()
  .url("Profile image must be a valid URL")
  .max(500, "Profile image URL is too long");

export async function updateProfileImage(imageUrl: string) {
  const { user } = await getSessionOrThrow();
  const validatedUrl = profileImageSchema.parse(imageUrl);

  // Get old image URL before updating
  const currentUser = await fetchUserById(user.id);
  const oldImageUrl = currentUser?.image ?? null;

  await updateUserImage(user.id, validatedUrl);

  return { ok: true as const, imageUrl: validatedUrl, oldImageUrl };
}

/**
 * Social link object for user profiles.
 * @property label - Display name for the link (e.g., "Instagram", "Website")
 * @property url - Valid URL to the external resource
 * @property icon - Optional icon identifier. Common values: 'instagram', 'website'.
 *                  Used by UI components to display appropriate icons.
 */
export type SocialLink = {
  label: string;
  url: string;
  icon?: string;
};

const SOCIAL_PLATFORM_RULES: Record<
  string,
  { hostnames: string[]; pathPattern?: RegExp }
> = {
  instagram: {
    hostnames: ["instagram.com", "www.instagram.com"],
    pathPattern: /^\/[A-Za-z0-9._-]+\/?$/,
  },
};

const getSocialPlatformKey = (link: SocialLink) => {
  const iconKey = link.icon?.toLowerCase();
  if (iconKey && SOCIAL_PLATFORM_RULES[iconKey]) return iconKey;
  const labelKey = link.label?.trim().toLowerCase();
  if (labelKey && SOCIAL_PLATFORM_RULES[labelKey]) return labelKey;
  return null;
};

const socialLinkSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, "Label is required")
      .max(50, "Label must be at most 50 characters"),
    url: z
      .string()
      .trim()
      .url("Must be a valid URL")
      .max(500, "URL is too long"),
    icon: z.string().optional(),
  })
  .superRefine((link, ctx) => {
    const platformKey = getSocialPlatformKey(link);
    const platformRules = platformKey
      ? SOCIAL_PLATFORM_RULES[platformKey]
      : null;
    if (!platformRules) return;

    let parsed: URL;
    try {
      parsed = new URL(link.url);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "Must be a valid URL",
      });
      return;
    }

    if (parsed.protocol !== "https:") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "Social links must use https",
      });
    }

    if (!platformRules.hostnames.includes(parsed.hostname)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: `${link.label} must use ${platformRules.hostnames[0]}`,
      });
    }

    if (
      platformRules.pathPattern &&
      !platformRules.pathPattern.test(parsed.pathname)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "Username looks invalid for this platform",
      });
    }
  });

const socialLinksArraySchema = z
  .array(socialLinkSchema)
  .max(10, "You can have at most 10 social links");

export async function updateSocialLinks(rawLinks: unknown) {
  const { user } = await getSessionOrThrow();
  const socialLinks = socialLinksArraySchema.parse(rawLinks);
  await updateUserSocialLinks(user.id, socialLinks);
  return { ok: true as const, socialLinks };
}

export const RESERVED_HANDLES = [
  "admin",
  "sharply",
  "official",
  "settings",
  "auth",
  "api",
  "gear",
  "lists",
  "u",
  "explore",
  "search",
  "notifications",
  "welcome",
  "signin",
  "signup",
  "verify-otp",
];

const handleSchema = z
  .string()
  .trim()
  .min(3, "Handle must be at least 3 characters")
  .max(50, "Handle must be at most 50 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Handle can only contain letters, numbers, hyphens, and underscores",
  )
  .toLowerCase()
  .refine((h) => !RESERVED_HANDLES.includes(h), "This handle is reserved");

/**
 * Resolves a user by handle, default user-number format, or UUID.
 */
export async function fetchUserByHandle(handle: string) {
  const normalizedHandle = handle.toLowerCase();

  // 1. Try exact handle match
  const byHandle = await db
    .select()
    .from(users)
    .where(eq(users.handle, normalizedHandle))
    .limit(1);
  if (byHandle[0]) return byHandle[0] as AuthUser;

  // 2. Try default handle fallback: user-{memberNumber}
  const match = normalizedHandle.match(/^user-(\d+)$/i);
  if (match?.[1]) {
    const memberNumber = parseInt(match[1]);
    const byMemberNumber = await db
      .select()
      .from(users)
      .where(eq(users.memberNumber, memberNumber))
      .limit(1);
    // Only return if they haven't set a custom handle yet (to avoid handle hijacking)
    if (byMemberNumber[0] && !byMemberNumber[0].handle) {
      return byMemberNumber[0] as AuthUser;
    }
  }

  // 3. Fallback to UUID (legacy support or internal linking)
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      handle,
    );
  if (isUuid) {
    return fetchFullUserById(handle);
  }

  return null;
}

export async function checkHandleAvailability(handle: string) {
  try {
    const validated = handleSchema.parse(handle);
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.handle, validated))
      .limit(1);

    return {
      available: existing.length === 0,
      reason: existing.length > 0 ? "Handle is already taken" : null,
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        available: false,
        reason: err.errors[0]?.message ?? "Invalid handle format",
      };
    }
    return { available: false, reason: "Invalid handle" };
  }
}

export async function updateUserHandle(rawHandle: string) {
  const { user } = await getSessionOrThrow();
  const handle = handleSchema.parse(rawHandle);

  const availability = await checkHandleAvailability(handle);
  if (!availability.available) {
    throw new Error(availability.reason ?? "Handle unavailable");
  }

  await db.update(users).set({ handle }).where(eq(users.id, user.id));
  return { ok: true as const, handle };
}

/**
 * Triggers a notification prompting the user to set their handle.
 * Only sends if one hasn't been sent with the same sourceId already.
 */
export async function triggerHandleSetupNotification(userId: string) {
  const sourceId = "handle_setup_prompt";

  // Check if already sent
  const existing = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.sourceId, sourceId),
      ),
    )
    .limit(1);

  if (existing.length > 0) return;

  await createNotificationData({
    userId,
    type: "prompt_handle_setup",
    title: "Choose your unique handle",
    body: "Visit your profile settings to choose your unique handle for your profile!",
    linkUrl: "/profile/settings",
    sourceType: "system",
    sourceId,
  });
}
