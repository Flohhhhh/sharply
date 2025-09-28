import { NextResponse } from "next/server";
import { InteractionResponseFlags } from "discord-interactions";

export const leaderboardCommand = {
  definition: {
    name: "leaderboard",
    description: "Show top contributors (approved edits + approved reviews)",
  },
  handler: async () => {
    try {
      const { db } = await import("~/server/db");
      const { users, reviews, gearEdits } = await import("~/server/db/schema");
      const { and, eq, desc, sql } = await import("drizzle-orm");

      // Compute contribution score = approved reviews + approved edits
      const rows = await db
        .select({
          userId: users.id,
          name: users.name,
          approvedReviews: sql<number>`COALESCE((SELECT count(*) FROM ${reviews} r WHERE r.created_by_id = ${users.id} AND r.status = 'APPROVED'), 0)`,
          approvedEdits: sql<number>`COALESCE((SELECT count(*) FROM ${gearEdits} e WHERE e.created_by_id = ${users.id} AND e.status = 'APPROVED'), 0)`,
        })
        .from(users)
        .limit(10);

      const scored = rows
        .map((r) => ({
          name: r.name ?? "(anonymous)",
          score: Number(r.approvedReviews ?? 0) + Number(r.approvedEdits ?? 0),
          reviews: Number(r.approvedReviews ?? 0),
          edits: Number(r.approvedEdits ?? 0),
        }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      if (scored.length === 0) {
        return NextResponse.json({
          type: 4,
          data: {
            content: "No contributions yet.",
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
        data: { content: `Top contributors:\n${lines.join("\n")}` },
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
