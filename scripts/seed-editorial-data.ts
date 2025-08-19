import { db } from "../src/server/db";
import { useCaseRatings, staffVerdicts, genres } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

async function seedEditorialData() {
  console.log("🌱 Seeding editorial data...");

  try {
    // First, let's check what genres exist
    const existingGenres = await db.select().from(genres);
    console.log("Existing genres:", existingGenres);

    // Get the Nikon Z6 III gear ID (from your logs)
    const gearId = "fcf00613-3a1a-4e5b-940f-9f13a304ed73";

    // Insert use-case ratings
    const ratingsData = [
      {
        gearId,
        genreId: existingGenres[0]?.id, // Use first available genre
        score: 9,
        note: "Excellent AF tracking and high FPS make this ideal for fast-moving subjects.",
      },
      {
        gearId,
        genreId: existingGenres[1]?.id, // Use second available genre
        score: 8,
        note: "Great low-light performance and dynamic range for landscape work.",
      },
      {
        gearId,
        genreId: existingGenres[2]?.id, // Use third available genre
        score: 7,
        note: "Good for portraits but not the best choice for studio work.",
      },
    ];

    for (const rating of ratingsData) {
      if (rating.genreId) {
        await db.insert(useCaseRatings).values(rating);
        console.log(
          `✅ Added rating for genre ${rating.genreId}: ${rating.score}/10`,
        );
      }
    }

    // Insert staff verdict
    const verdictData = {
      gearId,
      content: `The Nikon Z6 III represents a significant step forward for Nikon's mid-range mirrorless lineup. With its 24.5MP sensor, improved autofocus system, and enhanced video capabilities, it's a versatile camera that excels in multiple shooting scenarios.

The new stacked sensor design provides excellent readout speeds, enabling high-speed continuous shooting and reducing rolling shutter in video mode. The improved AF system with subject detection makes it much more capable for action photography compared to its predecessor.`,
      pros: [
        "Excellent autofocus performance with subject detection",
        "High-speed continuous shooting at 20fps",
        "Great low-light performance with ISO up to 204,800",
        "4K video with minimal rolling shutter",
        "Robust weather-sealed build quality",
      ],
      cons: [
        "Single card slot (CFexpress Type B)",
        "No built-in flash",
        "Battery life could be better for video",
        "Limited buffer depth in RAW at highest speeds",
      ],
      whoFor:
        "Photographers who need a versatile camera for sports, wildlife, and general photography with occasional video work.",
      notFor:
        "Professional videographers who need extensive video features, or photographers who require dual card slots for backup.",
      alternatives: [
        "Sony A7 IV - Better video features and dual card slots",
        "Canon R6 Mark II - Superior AF and faster burst rates",
        "Nikon Z7 II - Higher resolution for landscape work",
      ],
    };

    await db.insert(staffVerdicts).values(verdictData);
    console.log("✅ Added staff verdict");

    console.log("🎉 Editorial data seeding complete!");
  } catch (error) {
    console.error("❌ Error seeding editorial data:", error);
  }
}

seedEditorialData()
  .then(() => {
    console.log("Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
