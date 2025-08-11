import "dotenv/config";
import { eq } from "drizzle-orm";
import slugify from "slugify";
import { db } from "../src/server/db";
import { brands, gear, mounts, sensorFormats } from "../src/server/db/schema";
import { normalizeSearchName } from "../src/lib/utils";

const s = (v: string) => slugify(v, { lower: true, strict: true });

async function upsertBySlug<T extends { slug: string }>(table: any, row: T) {
  const existing = await db
    .select()
    .from(table)
    .where(eq(table.slug, row.slug))
    .limit(1);
  if (existing.length) return existing[0];
  await db.insert(table).values(row);
  const [inserted] = await db
    .select()
    .from(table)
    .where(eq(table.slug, row.slug))
    .limit(1);
  return inserted;
}

async function main() {
  // Seed brands from CSV data
  const brandData = [
    { name: "ACME Imaging", slug: "acme" },
    { name: "Nikon", slug: "nikon" },
    { name: "Canon", slug: "canon" },
    { name: "Sony", slug: "sony" },
    { name: "Fujifilm", slug: "fujifilm" },
    { name: "Leica", slug: "leica" },
    { name: "Pentax", slug: "pentax" },
    { name: "Sigma", slug: "sigma" },
    { name: "Tamron", slug: "tamron" },
    { name: "Minolta", slug: "minolta" },
    { name: "Panasonic", slug: "panasonic" },
    { name: "Hasselblad", slug: "hasselblad" },
    { name: "Olympus", slug: "olympus" },
    { name: "PhaseOne", slug: "phase-one" },
    { name: "Viltrox", slug: "viltrox" },
    { name: "Samsung", slug: "samsung" },
    { name: "Lensbaby", slug: "lensbaby" },
    { name: "Tokina", slug: "tokina" },
    { name: "TTAritsan", slug: "ttartisan" },
    { name: "Meike", slug: "meike" },
    { name: "Samyang/Rokinon", slug: "samyang" },
    { name: "Voigtlander", slug: "voigtlander" },
    { name: "Zeiss", slug: "zeiss" },
    { name: "7Artisans", slug: "svn-artisans" },
    { name: "SIRUI", slug: "sirui" },
    { name: "Yongnuo", slug: "yongnuo" },
    { name: "ARRI", slug: "arri" },
    { name: "Red", slug: "red" },
  ];

  // Insert all brands and get references for mounts
  const brandMap = new Map<string, any>();
  for (const brand of brandData) {
    try {
      console.log(`Processing brand: ${brand.name} (${brand.slug})`);
      const result = await upsertBySlug(brands, brand);
      brandMap.set(brand.slug, result);
      console.log(`Brand ${brand.name} processed successfully`);
    } catch (error) {
      console.error(`Error with brand ${brand.name}:`, error);
      throw error;
    }
  }

  // Get specific brands for mount references
  const canon = brandMap.get("canon");
  const nikon = brandMap.get("nikon");
  const sony = brandMap.get("sony");
  const fujifilm = brandMap.get("fujifilm");
  const leica = brandMap.get("leica");
  const pentax = brandMap.get("pentax");
  const sigma = brandMap.get("sigma");
  const panasonic = brandMap.get("panasonic");

  // Seed mounts with generated UUIDs
  const mountData = [
    { id: crypto.randomUUID(), value: "rf-canon", brandId: canon!.id },
    { id: crypto.randomUUID(), value: "ef-canon", brandId: canon!.id },
    { id: crypto.randomUUID(), value: "z-nikon", brandId: nikon!.id },
    { id: crypto.randomUUID(), value: "f-nikon", brandId: nikon!.id },
    { id: crypto.randomUUID(), value: "nikon1-nikon", brandId: nikon!.id },
    { id: crypto.randomUUID(), value: "s-nikon", brandId: nikon!.id },
    { id: crypto.randomUUID(), value: "e-sony", brandId: sony!.id },
    { id: crypto.randomUUID(), value: "a-sony", brandId: sony!.id },
    { id: crypto.randomUUID(), value: "x-fujifilm", brandId: fujifilm!.id },
    { id: crypto.randomUUID(), value: "g-fujifilm", brandId: fujifilm!.id },
    { id: crypto.randomUUID(), value: "l-leica", brandId: leica!.id },
    { id: crypto.randomUUID(), value: "m-leica", brandId: leica!.id },
    { id: crypto.randomUUID(), value: "s-leica", brandId: leica!.id },
    { id: crypto.randomUUID(), value: "k-pentax", brandId: pentax!.id },
    { id: crypto.randomUUID(), value: "q-pentax", brandId: pentax!.id },
    { id: crypto.randomUUID(), value: "sa-sigma", brandId: sigma!.id },
    { id: crypto.randomUUID(), value: "h-sigma", brandId: sigma!.id },
    { id: crypto.randomUUID(), value: "v-sigma", brandId: sigma!.id },
    { id: crypto.randomUUID(), value: "m43-panasonic", brandId: panasonic!.id },
  ];

  for (const mount of mountData) {
    try {
      // Check if mount already exists by value
      const existing = await db
        .select()
        .from(mounts)
        .where(eq(mounts.value, mount.value))
        .limit(1);

      if (!existing.length) {
        // Only insert if it doesn't exist
        console.log(
          `Inserting mount: ${mount.value} for brand: ${mount.brandId}`,
        );
        await db.insert(mounts).values(mount);
      } else {
        console.log(`Mount ${mount.value} already exists`);
      }
    } catch (error) {
      console.error(`Error with mount ${mount.value}:`, error);
      throw error;
    }
  }

  // Get all mounts and create a simple lookup object
  const allMounts = await db.select().from(mounts);
  const mountLookup = allMounts.reduce(
    (acc: Record<string, string>, mount: any) => {
      acc[mount.value] = mount.id;
      return acc;
    },
    {},
  );

  console.log("Available mounts:", Object.keys(mountLookup));

  // Seed sensor formats
  const sensorFormatData = [
    { name: "Full-frame", slug: "full-frame" },
    { name: "APS-C", slug: "aps-c" },
    { name: "Canon APS-C", slug: "canon-aps-c" },
    { name: "Medium Format", slug: "medium-format" },
    { name: "Micro 4/3", slug: "micro-4-3" },
    { name: '1"', slug: "1-inch" },
    { name: "Canon APS-H", slug: "canon-aps-h" },
  ];

  const sensorFormatMap = new Map<string, any>();
  for (const format of sensorFormatData) {
    const result = await upsertBySlug(sensorFormats, format);
    sensorFormatMap.set(format.slug, result);
  }

  // Sample gear rows with normalized search names
  // The normalizeSearchName function combines brand name and gear name for better searchability
  const items: (typeof gear.$inferInsert)[] = [
    {
      name: "Nikon Z 400mm f/4.5 VR S",
      slug: s("Nikon Z 400mm f/4.5 VR S"),
      searchName: normalizeSearchName("Nikon Z 400mm f/4.5 VR S", "Nikon"),
      gearType: "LENS" as const,
      brandId: nikon!.id,
      mountId: mountLookup["z-nikon"] || null,
      msrpUsdCents: 324900,
      releaseDate: new Date("2023-01-01"),
      thumbnailUrl: null,
    },
    {
      name: "Nikon Z6 III",
      slug: s("Nikon Z6 III"),
      searchName: normalizeSearchName("Nikon Z6 III", "Nikon"),
      gearType: "CAMERA" as const,
      brandId: nikon!.id,
      mountId: mountLookup["z-nikon"] || null,
      msrpUsdCents: 159695,
      releaseDate: new Date("2023-01-01"),
      thumbnailUrl: null,
    },
    {
      name: "Canon EOS R5ii",
      slug: s("Canon EOS R5ii"),
      searchName: normalizeSearchName("Canon EOS R5ii", "Canon"),
      gearType: "CAMERA" as const,
      brandId: canon!.id,
      mountId: mountLookup["rf-canon"] || null,
      msrpUsdCents: 389900,
      releaseDate: new Date("2023-01-01"),
      thumbnailUrl: null,
    },
    {
      name: "Sony Alpha A7 IV",
      slug: s("Sony Alpha A7 IV"),
      searchName: normalizeSearchName("Sony Alpha A7 IV", "Sony"),
      gearType: "CAMERA" as const,
      brandId: sony!.id,
      mountId: mountLookup["e-sony"] || null,
      msrpUsdCents: 249900,
      releaseDate: new Date("2023-01-01"),
      thumbnailUrl: null,
    },
    {
      name: "Fujifilm X-T5",
      slug: s("Fujifilm X-T5"),
      searchName: normalizeSearchName("Fujifilm X-T5", "Fujifilm"),
      gearType: "CAMERA" as const,
      brandId: fujifilm!.id,
      mountId: mountLookup["x-fujifilm"] || null,
      msrpUsdCents: 169900,
      releaseDate: new Date("2023-01-01"),
      thumbnailUrl: null,
    },
  ];

  // Mount IDs will be set directly in the gear items below
  console.log("Mounts available for assignment:", mountLookup);

  // Demonstrate the normalizeSearchName function
  console.log("\n=== normalizeSearchName Examples ===");
  console.log(
    `"Nikon Z6 III" + "Nikon" → "${normalizeSearchName("Nikon Z6 III", "Nikon")}"`,
  );
  console.log(
    `"Canon EOS R5ii" + "Canon" → "${normalizeSearchName("Canon EOS R5ii", "Canon")}"`,
  );
  console.log(
    `"Sony Alpha A7 IV" + "Sony" → "${normalizeSearchName("Sony Alpha A7 IV", "Sony")}"`,
  );
  console.log(
    `"Fujifilm X-T5" + "Fujifilm" → "${normalizeSearchName("Fujifilm X-T5", "Fujifilm")}"`,
  );
  console.log("=====================================\n");

  // Clear existing gear items first
  await db.delete(gear);
  console.log("Cleared existing gear items");

  // Insert gear items with correct mount IDs
  const insertedGear: any[] = [];
  for (const g of items) {
    console.log(`Inserting gear: ${g.name} with mountId: ${g.mountId}`);
    const [inserted] = await db.insert(gear).values(g).returning();
    insertedGear.push(inserted);
  }

  // Seed camera and lens specifications
  console.log("Seeding gear specifications...");

  // Import the specs tables
  const { cameraSpecs, lensSpecs } = await import("../src/server/db/schema");

  // Clear existing specs
  await db.delete(cameraSpecs);
  await db.delete(lensSpecs);

  // Add camera specifications
  for (const item of insertedGear) {
    if (item.gearType === "CAMERA") {
      await db.insert(cameraSpecs).values({
        gearId: item.id,
        sensorFormatId: sensorFormatMap.get("full-frame")!.id,
        resolutionMp: "24.0", // Use string for decimal fields
        isoMin: 100,
        isoMax: 51200,
        maxFpsRaw: 30,
        maxFpsJpg: 120,
        extra: {},
      });
      console.log(`Added camera specs for: ${item.name}`);
    } else if (item.gearType === "LENS") {
      await db.insert(lensSpecs).values({
        gearId: item.id,
        focalLengthMinMm: "400.0", // Use string for decimal fields
        focalLengthMaxMm: "400.0", // Use string for decimal fields
        hasStabilization: true,
        extra: {},
      });
      console.log(`Added lens specs for: ${item.name}`);
    }
  }

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
