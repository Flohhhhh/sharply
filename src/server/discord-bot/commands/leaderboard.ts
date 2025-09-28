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
      const { sql, count, inArray } = await import("drizzle-orm");

      // Aggregate reviews and edits by user separately and merge in app layer
      const [reviewsByUser, editsByUser] = await Promise.all([
        db
          .select({ userId: reviews.createdById, c: count() })
          .from(reviews)
          .groupBy(reviews.createdById),
        db
          .select({ userId: gearEdits.createdById, c: count() })
          .from(gearEdits)
          .groupBy(gearEdits.createdById),
      ]);

      const userIds = new Set<string>();
      for (const r of reviewsByUser) if (r.userId) userIds.add(r.userId);
      for (const e of editsByUser) if (e.userId) userIds.add(e.userId);

      const idList = Array.from(userIds);
      const usersRows = idList.length
        ? await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(inArray(users.id, idList))
        : [];

      const idToName = new Map<string, string | null>(
        usersRows.map((u) => [u.id, u.name]),
      );
      const reviewMap = new Map<string, number>(
        reviewsByUser.map((r) => [r.userId, Number(r.c ?? 0)]),
      );
      const editMap = new Map<string, number>(
        editsByUser.map((e) => [e.userId, Number(e.c ?? 0)]),
      );

      const scored = idList
        .map((id) => {
          const reviewsCount = reviewMap.get(id) ?? 0;
          const editsCount = editMap.get(id) ?? 0;
          return {
            name: idToName.get(id) ?? "(anonymous)",
            score: reviewsCount + editsCount,
            reviews: reviewsCount,
            edits: editsCount,
          };
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // Debug aggregates to reconcile with homepage counter
      const [[reviewsAgg], [editsAgg]] = await Promise.all([
        db.select({ c: sql<number>`count(*)` }).from(reviews),
        db.select({ c: sql<number>`count(*)` }).from(gearEdits),
      ]);
      // const debugLine = `debug — users:${usersRows.length} reviews:${Number(
      //   reviewsAgg?.c ?? 0,
      // )} edits:${Number(editsAgg?.c ?? 0)} nonZero:${scored.length}`;

      if (scored.length === 0) {
        return NextResponse.json({
          type: 4,
          data: {
            content: `No contributions yet.`,
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
          content: `Top contributors:\n${lines.join("\n")}`,
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
