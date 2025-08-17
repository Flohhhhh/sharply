import "dotenv/config";
import { db } from "../src/server/db";
import { gear } from "../src/server/db/schema";
import { or, isNull } from "drizzle-orm";

async function main() {
  console.log("Listing gear with any null link field...\n");
  const rows = await db
    .select({
      id: gear.id,
      name: gear.name,
      slug: gear.slug,
      linkManufacturer: gear.linkManufacturer,
      linkMpb: gear.linkMpb,
      linkAmazon: gear.linkAmazon,
    })
    .from(gear)
    .where(
      or(
        isNull(gear.linkManufacturer),
        isNull(gear.linkMpb),
        isNull(gear.linkAmazon),
      ),
    );

  if (!rows.length) {
    console.log("No gear items found with null link fields.");
    return;
  }

  for (const r of rows) {
    const missing: string[] = [];
    if (r.linkManufacturer === null) missing.push("manufacturer");
    if (r.linkMpb === null) missing.push("mpb");
    if (r.linkAmazon === null) missing.push("amazon");
    console.log(`- ${r.name} (${r.slug}) → missing: ${missing.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
