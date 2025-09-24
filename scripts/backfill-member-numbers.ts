import "dotenv/config";
import { asc, eq } from "drizzle-orm";
import { db } from "../src/server/db";
import { users } from "../src/server/db/schema";

async function main() {
  const existing = await db.select().from(users).orderBy(asc(users.createdAt));

  let next = 1;
  for (const u of existing) {
    if (u.memberNumber && u.memberNumber > 0) {
      next = Math.max(next, u.memberNumber + 1);
      continue;
    }
    await db
      .update(users)
      .set({ memberNumber: next })
      .where(eq(users.id, u.id));
    next += 1;
    console.log(`Assigned member #${next - 1} to ${u.id}`);
  }

  console.log("Backfill complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
