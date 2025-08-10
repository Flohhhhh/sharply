import "dotenv/config";
import { eq } from "drizzle-orm";
import slugify from "slugify";
import { db } from "../src/server/db";
import { brands, gear, mounts, sensorFormats } from "../src/server/db/schema";

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

  // Get specific mounts from the database
  const zMount = await db
    .select()
    .from(mounts)
    .where(eq(mounts.value, "z-nikon"))
    .limit(1);
  const rfMount = await db
    .select()
    .from(mounts)
    .where(eq(mounts.value, "rf-canon"))
    .limit(1);

  console.log("Found mounts:", {
    zMount: zMount[0]?.value,
    rfMount: rfMount[0]?.value,
    zMountId: zMount[0]?.id,
    rfMountId: rfMount[0]?.id,
  });

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

  for (const format of sensorFormatData) {
    await upsertBySlug(sensorFormats, format);
  }

  // Two sample gear rows
  const items: Array<{
    name: string;
    slug: string;
    searchName: string;
    gearType: "CAMERA" | "LENS";
    brandId: string;
    mountId: string | null;
    priceUsdCents: number;
    thumbnailUrl: string | null;
  }> = [
    {
      name: "Nikon Z 400mm f/4.5 VR S",
      slug: s("Nikon Z 400mm f/4.5 VR S"),
      searchName: "nikon z 400mm f/4.5 vr s",
      gearType: "LENS" as const,
      brandId: nikon!.id,
      mountId: null, // Will be set after mount lookup
      priceUsdCents: 324900,
      thumbnailUrl: null,
    },
    {
      name: "Nikon Z6 III",
      slug: s("Nikon Z6 III"),
      searchName: "nikon z6 iii",
      gearType: "CAMERA" as const,
      brandId: nikon!.id,
      mountId: null, // Will be set after mount lookup
      priceUsdCents: 159695,
      thumbnailUrl: null,
    },
    {
      name: "Canon EOS R5ii",
      slug: s("Canon EOS R5ii"),
      searchName: "canon eos r5ii",
      gearType: "CAMERA" as const,
      brandId: canon!.id,
      mountId: null, // Will be set after mount lookup
      priceUsdCents: 389900,
      thumbnailUrl: null,
    },
  ];

  // Set mount IDs directly from the seeded data
  for (const item of items) {
    if (item.name.includes("Nikon Z")) {
      item.mountId = zMount[0]?.id || null;
      console.log(`Setting ${item.name} mountId to: ${item.mountId}`);
    } else if (item.name.includes("Canon EOS")) {
      item.mountId = rfMount[0]?.id || null;
      console.log(`Setting ${item.name} mountId to: ${item.mountId}`);
    }
  }

  // Clear existing gear items first
  await db.delete(gear);
  console.log("Cleared existing gear items");

  // Insert gear items with correct mount IDs
  for (const g of items) {
    console.log(`Inserting gear: ${g.name} with mountId: ${g.mountId}`);
    await db.insert(gear).values(g);
  }

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
