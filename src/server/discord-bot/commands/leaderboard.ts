import { NextResponse } from "next/server";
import { InteractionResponseFlags } from "discord-interactions";

export const leaderboardCommand = {
  definition: {
    name: "leaderboard",
    description: "Show top contributors (edits + reviews)",
  },
  handler: async () => {
    try {
      const { db } = await import("~/server/db");
      const { users, reviews, gearEdits } = await import("~/server/db/schema");
      const { sql } = await import("drizzle-orm");

      // Compute contribution score = total reviews + total edits (all statuses)
      // Note: we do not LIMIT in SQL so we can sort by computed score in app and then slice top 10
      const rows = await db
        .select({
          userId: users.id,
          name: users.name,
          reviewCount: sql<number>`COALESCE((SELECT count(*) FROM ${reviews} r WHERE r.created_by_id = ${users.id}), 0)`,
          editCount: sql<number>`COALESCE((SELECT count(*) FROM ${gearEdits} e WHERE e.created_by_id = ${users.id}), 0)`,
        })
        .from(users);

      const scored = rows
        .map((r) => ({
          name: r.name ?? "(anonymous)",
          score: Number(r.reviewCount ?? 0) + Number(r.editCount ?? 0),
          reviews: Number(r.reviewCount ?? 0),
          edits: Number(r.editCount ?? 0),
        }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // Debug aggregates to reconcile with homepage counter
      const [[reviewsAgg], [editsAgg]] = await Promise.all([
        db.select({ c: sql<number>`count(*)` }).from(reviews),
        db.select({ c: sql<number>`count(*)` }).from(gearEdits),
      ]);
      const debugLine = `debug — users:${rows.length} reviews:${Number(
        reviewsAgg?.c ?? 0,
      )} edits:${Number(editsAgg?.c ?? 0)} nonZero:${scored.length}`;

      if (scored.length === 0) {
        return NextResponse.json({
          type: 4,
          data: {
            content: `No contributions yet.\n${debugLine}`,
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }

      const lines = scored.map(
        (u, i) =>
          `${i + 1}. ${u.name} — ${u.score} (edits ${u.edits}, reviews ${u.reviews})`,
      );

      return NextResponse.json({
        type: 4,
        data: {
          content: `Top contributors:\n${lines.join("\n")}\n\n${debugLine}`,
        },
      });
    } catch (err) {
      console.error("/leaderboard error", err);
      return NextResponse.json({
        type: 4,
        data: {
          content: "Error fetching leaderboard.",
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    }
  },
};
