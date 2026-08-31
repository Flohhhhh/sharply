/**
 * E2E-only DB fixtures for the Playwright read sweep. Runs AFTER db:seed in
 * the e2e pipeline (CI + setup-local). Never run against dev/prod databases.
 * Values are consumed by tests/playwright/utils/route-manifest.ts — keep in sync.
 */
import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "../../src/server/db";
import {
  gearTags,
  invites,
  recommendationCharts,
  recommendationItems,
  sharedLists,
  tags,
  userListItems,
  userLists,
  users,
} from "../../src/server/db/schema";

const Z6III_ID = "ec11113e-ae24-44cb-871f-4eb763d2d378"; // scripts/seed.ts liveZ6iii

async function ensureDevUser() {
  const existing = await db.select().from(users).where(eq(users.email, "dev@sharply.local")).limit(1);
  if (existing[0]) {
    const [updated] = await db
      .update(users)
      .set({ role: "SUPERADMIN", handle: "sharply-dev", name: "Sharply Dev User" })
      .where(eq(users.id, existing[0].id))
      .returning();
    return updated ?? existing[0];
  }
  const [created] = await db
    .insert(users)
    .values({
      name: "Sharply Dev User",
      email: "dev@sharply.local",
      role: "SUPERADMIN",
      handle: "sharply-dev",
    })
    .returning();
  return created!;
}

async function ensureTag() {
  const [tag] = await db
    .insert(tags)
    .values({
      name: "E2E Seed Collection",
      slug: "e2e-seed-collection",
      description: "Deterministic tag for the e2e read sweep.",
    })
    .onConflictDoNothing({ target: tags.slug })
    .returning();
  const record =
    tag ?? (await db.select().from(tags).where(eq(tags.slug, "e2e-seed-collection")).limit(1))[0]!;
  await db
    .insert(gearTags)
    .values({ gearId: Z6III_ID, tagId: record.id })
    .onConflictDoNothing();
}

async function ensureSharedList(userId: string) {
  const existing = await db
    .select()
    .from(sharedLists)
    .where(eq(sharedLists.publicId, "e2eseedpub1"))
    .limit(1);
  if (existing[0]) return;
  const [list] = await db
    .insert(userLists)
    .values({ userId, name: "E2E Shared List" })
    .returning();
  await db.insert(userListItems).values({ listId: list!.id, gearId: Z6III_ID });
  await db.insert(sharedLists).values({
    listId: list!.id,
    slug: "e2e-shared-list",
    publicId: "e2eseedpub1",
    isPublished: true,
  });
}

async function ensureInvite(createdById: string) {
  await db
    .insert(invites)
    .values({
      id: "e2e-invite-fixture-0001",
      inviteeName: "E2E Invitee",
      createdById,
    })
    .onConflictDoNothing({ target: invites.id });
}

async function ensureRecommendationChart() {
  const existing = await db
    .select()
    .from(recommendationCharts)
    .where(eq(recommendationCharts.slug, "e2e-seed-chart"))
    .limit(1);
  if (existing[0]) return;
  const [chart] = await db
    .insert(recommendationCharts)
    .values({
      brand: "nikon",
      slug: "e2e-seed-chart",
      title: "E2E Seed Nikon Chart",
      updatedDate: "2026-08-31",
      isPublished: true,
    })
    .returning();
  await db.insert(recommendationItems).values({
    chartId: chart!.id,
    gearId: Z6III_ID,
    rating: "balanced", // recommendationRatingEnum, schema.ts:336
  });
}

async function main() {
  const devUser = await ensureDevUser();
  await ensureTag();
  await ensureSharedList(devUser.id);
  await ensureInvite(devUser.id);
  await ensureRecommendationChart();
  console.log("[e2e:seed-fixtures] fixtures ensured");
  process.exit(0);
}

main().catch((error) => {
  console.error("[e2e:seed-fixtures] failed", error);
  process.exit(1);
});
