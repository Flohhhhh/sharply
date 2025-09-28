import { NextResponse } from "next/server";
import { InteractionResponseFlags } from "discord-interactions";

export const trendingCommand = {
  definition: {
    name: "trending",
    description: "Show top 10 trending gear items",
    options: [
      {
        name: "window",
        description: "Time window (7d or 30d)",
        type: 3, // STRING
        required: false,
      },
    ],
  },
  handler: async (interaction: any) => {
    try {
      type CommandOption = {
        name: string;
        type?: number;
        value?: unknown;
        options?: CommandOption[];
      };
      const optionsRaw = (interaction?.data as any)?.options as
        | CommandOption[]
        | undefined;
      const opts: CommandOption[] = Array.isArray(optionsRaw) ? optionsRaw : [];
      const windowOpt = (opts.find((o) => o.name === "window")?.value ||
        "7d") as string;
      const timeframe: "7d" | "30d" = windowOpt === "30d" ? "30d" : "7d";

      const { getTrendingData } = await import("~/server/popularity/data");
      const items = await getTrendingData(timeframe, 10, {});

      if (!items || items.length === 0) {
        return NextResponse.json({
          type: 4,
          data: {
            content: "No trending items found.",
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }

      const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
      const lines = items.map((g, i) => {
        const brand = (g.brandName ?? "").trim();
        const name = (g.name ?? "").trim();
        const startsWithBrand =
          brand.length > 0 &&
          name.toLowerCase().startsWith(brand.toLowerCase());
        const displayName =
          startsWithBrand || brand.length === 0 ? name : `${brand} ${name}`;
        const url = base ? `${base}/gear/${g.slug}` : `/gear/${g.slug}`;
        return `${i + 1}. ${displayName} — ${url}`;
      });

      return NextResponse.json({
        type: 4,
        data: { content: `Top trending (${timeframe}):\n${lines.join("\n")}` },
      });
    } catch (err) {
      console.error("/trending error", err);
      return NextResponse.json({
        type: 4,
        data: {
          content: "Error fetching trending items.",
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    }
  },
};
