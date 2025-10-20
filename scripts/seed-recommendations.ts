import "dotenv/config";
import { db } from "../src/server/db";
import {
  recommendationCharts,
  recommendationItems,
} from "../src/server/db/schema";

type SeedItem = {
  gearId: string;
  rating: (typeof recommendationItems.rating.enumValues)[number];
  note?: string;
  groupOverride?: (typeof recommendationItems.groupOverride.enumValues)[number];
  customColumn?: string;
  priceMinOverride?: number;
  priceMaxOverride?: number;
};

type SeedChart = {
  brand: string;
  slug: string;
  title: string;
  description?: string | null;
  isPublished?: boolean;
  items?: SeedItem[];
};

// Add charts here. Start empty; populate as needed.
const charts: SeedChart[] = [
  {
    brand: "canon",
    slug: "ef",
    title: "Canon EF Full-Frame",
    isPublished: false,
    items: [
      {
        gearId: "canon-ef-24-105mm-f-4l-is-usm",
        rating: "best value",
        note: "Best value for the money",
      },
    ],
  },
  {
    brand: "canon",
    slug: "ef-s-apsc",
    title: "Canon EF-S APS-C",
    isPublished: false,
    items: [],
  },
  {
    brand: "canon",
    slug: "rf",
    title: "Canon RF Full-Frame",
    isPublished: false,
    items: [],
  },
  {
    brand: "canon",
    slug: "rf-s-apsc",
    title: "Canon RF-S APS-C",
    isPublished: false,
    items: [],
  },
  {
    brand: "nikon",
    slug: "f",
    title: "Nikon F Full-Frame",
    isPublished: false,
    items: [],
  },
  {
    brand: "nikon",
    slug: "f-dx",
    title: "Nikon F (DX) APS-C",
    isPublished: false,
    items: [],
  },
  {
    brand: "nikon",
    slug: "z",
    title: "Nikon Z Full-Frame",
    isPublished: false,
    items: [],
  },
  {
    brand: "nikon",
    slug: "z-dx",
    title: "Nikon Z (DX) APS-C",
    isPublished: false,
    items: [],
  },
  {
    brand: "sony",
    slug: "e",
    title: "Sony E Full-Frame",
    isPublished: false,
    items: [],
  },
  {
    brand: "sony",
    slug: "e-apsc",
    title: "Sony E APS-C",
    isPublished: false,
    items: [],
  },
];

async function main() {
  console.log("[seed:recs] starting");
  if (charts.length === 0) {
    console.log(
      "[seed:recs] no charts to seed (empty array). Add items to the charts array when ready.",
    );
    return;
  }

  for (const chart of charts) {
    const [inserted] = await db
      .insert(recommendationCharts)
      .values({
        brand: chart.brand.toLowerCase(),
        slug: chart.slug.toLowerCase(),
        title: chart.title,
        description: chart.description ?? null,
        updatedDate: new Date().toISOString().slice(0, 10),
        isPublished: chart.isPublished ?? true,
      })
      .returning({
        id: recommendationCharts.id,
        brand: recommendationCharts.brand,
        slug: recommendationCharts.slug,
      });

    console.log(
      `[seed:recs] chart inserted ${inserted?.brand}/${inserted?.slug}`,
    );

    const items = chart.items ?? [];
    if (items.length === 0) continue;

    await db.insert(recommendationItems).values(
      items.map((it) => ({
        chartId: inserted!.id,
        gearId: it.gearId,
        rating: it.rating,
        note: it.note ?? null,
        groupOverride: it.groupOverride ?? null,
        customColumn: it.customColumn ?? null,
        priceMinOverride: it.priceMinOverride ?? null,
        priceMaxOverride: it.priceMaxOverride ?? null,
      })),
    );
    console.log(
      `[seed:recs] inserted ${items.length} items for ${inserted!.brand}/${inserted!.slug}`,
    );
  }
}

main().catch((err) => {
  console.error("[seed:recs] failed", err);
  process.exit(1);
});
