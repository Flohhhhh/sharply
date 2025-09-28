import { NextResponse } from "next/server";
import { InteractionResponseFlags } from "discord-interactions";

export const totalsCommand = {
  definition: {
    name: "totals",
    description: "Show total gear items and total contributions",
  },
  handler: async () => {
    try {
      const { fetchGearCount, fetchContributionCount } = await import(
        "~/server/metrics/service"
      );
      const [gearCount, contribCount] = await Promise.all([
        fetchGearCount(),
        fetchContributionCount(),
      ]);

      return NextResponse.json({
        type: 4,
        data: {
          content: `Totals — Gear: ${gearCount.toLocaleString()}, Contributions: ${contribCount.toLocaleString()}`,
        },
      });
    } catch (err) {
      console.error("/totals error", err);
      return NextResponse.json({
        type: 4,
        data: {
          content: "Error fetching totals.",
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    }
  },
};
