import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { gear } from "~/server/db/schema";
import { NumberTicker } from "~/components/magicui/number-ticker";

export async function GearCounter() {
  const result = await db.select({ count: sql<number>`count(*)` }).from(gear);
  const totalGearItems = Number(result[0]?.count ?? 0);

  return (
    <div>
      <NumberTicker value={totalGearItems} className="text-5xl font-bold" />
      <p className="text-muted-foreground">Gear items in our database</p>
    </div>
  );
}
