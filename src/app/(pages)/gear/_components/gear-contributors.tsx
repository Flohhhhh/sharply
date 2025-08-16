import { db } from "~/server/db";
import { gearEdits, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { GearContributorsClient } from "./gear-contributors-client";

interface GearContributorsProps {
  gearId: string;
}

export async function GearContributors({ gearId }: GearContributorsProps) {
  // Fetch all edits for this gear with user info
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      image: users.image,
      payload: gearEdits.payload,
    })
    .from(gearEdits)
    .innerJoin(users, eq(gearEdits.createdById, users.id))
    .where(eq(gearEdits.gearId, gearId));

  // Aggregate contribution counts per user by counting fields in payloads
  const contributions = new Map<
    string,
    { id: string; name: string | null; image: string | null; count: number }
  >();
  const countFields = (payload: any): number => {
    if (!payload || typeof payload !== "object") return 0;
    let total = 0;
    const sections = ["core", "camera", "lens"] as const;
    for (const key of sections) {
      const section = (payload as any)[key];
      if (section && typeof section === "object") {
        total += Object.keys(section).length;
      }
    }
    return total;
  };
  for (const r of rows) {
    const prev = contributions.get(r.userId) ?? {
      id: r.userId,
      name: r.name,
      image: r.image,
      count: 0,
    };
    prev.count += countFields(r.payload as any);
    contributions.set(r.userId, prev);
  }

  let contributors = Array.from(contributions.values());

  // TODO: remove this once we have real contributors
  // TEMP: add two test contributors with counts
  contributors = contributors.concat([
    { id: "test_user_1", name: "Test User One", image: null, count: 7 },
    { id: "test_user_2", name: "Test User Two", image: null, count: 5 },
  ]);

  // Sort by total fields contributed (desc)
  contributors.sort((a, b) => b.count - a.count);

  if (contributors.length === 0) return null;

  return <GearContributorsClient contributors={contributors} />;
}
