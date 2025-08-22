import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { gearEdits, reviews } from "~/server/db/schema";
import { NumberTicker } from "~/components/magicui/number-ticker";

export async function ContributionCounter() {
  const [editResult, reviewResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(gearEdits),
    db.select({ count: sql<number>`count(*)` }).from(reviews),
  ]);
  const totalContributions =
    Number(editResult[0]?.count ?? 0) + Number(reviewResult[0]?.count ?? 0);

  return (
    <div>
      <NumberTicker value={totalContributions} className="text-5xl font-bold" />
      <p className="text-muted-foreground">Contributions by members</p>
    </div>
  );
}
