import { NextResponse } from "next/server";
import { InteractionResponseFlags } from "discord-interactions";
import { searchGear } from "~/server/search/service";

export const getGearCommand = {
  definition: {
    name: "gear",
    description: "Search or fetch details about a gear item",
    options: [
      {
        type: 1, // SUB_COMMAND
        name: "search",
        description: "Search for gear",
        options: [
          {
            name: "query",
            description: "Gear search text",
            type: 3, // STRING
            required: true,
          },
        ],
      },
      {
        type: 1, // SUB_COMMAND
        name: "price",
        description: "Show stored prices for a gear item",
        options: [
          {
            name: "query",
            description: "Gear search text",
            type: 3, // STRING
            required: true,
          },
        ],
      },
    ],
  },
  handler: async (interaction: any) => {
    type CommandOption = {
      name: string;
      type?: number;
      value?: unknown;
      options?: CommandOption[];
    };
    const optionsRaw = (interaction?.data as any)?.options as
      | CommandOption[]
      | undefined;
    const options: CommandOption[] = Array.isArray(optionsRaw)
      ? optionsRaw
      : [];
    const sub = options.find((o) => o.type === 1 /* SUB_COMMAND */);
    const rootSearch = options.find((o) => o.name === "search")?.value as
      | string
      | undefined;
    const searchQueryFromSub =
      sub?.name === "search"
        ? (sub.options?.find((o) => o.name === "query")?.value as
            | string
            | undefined)
        : undefined;

    try {
      // Handle subcommands first
      if (sub?.name === "price") {
        const q = sub.options?.find((o) => o.name === "query")?.value as
          | string
          | undefined;
        if (!q) {
          return NextResponse.json({
            type: 4,
            data: {
              content: "Provide a query: /gear price query:[text]",
              flags: InteractionResponseFlags.EPHEMERAL,
            },
          });
        }
        const priceSearch = await searchGear({
          query: q,
          sort: "relevance",
          page: 1,
          pageSize: 1,
        });
        const item = priceSearch.results[0];
        if (!item) {
          return NextResponse.json({
            type: 4,
            data: {
              content: `No gear found for "${q}"`,
              flags: InteractionResponseFlags.EPHEMERAL,
            },
          });
        }
        const { formatPrice } = await import("~/lib/mapping/price-map");
        // Fetch latest prices from `gear` table via service/data
        const { db } = await import("~/server/db");
        const { gear } = await import("~/server/db/schema");
        const { eq } = await import("drizzle-orm");
        const row = await db
          .select({
            msrpNowUsdCents: gear.msrpNowUsdCents,
            msrpAtLaunchUsdCents: gear.msrpAtLaunchUsdCents,
            mpbMaxPriceUsdCents: gear.mpbMaxPriceUsdCents,
          })
          .from(gear)
          .where(eq(gear.slug, item.slug))
          .limit(1);
        const prices = row[0] ?? {
          msrpNowUsdCents: null,
          msrpAtLaunchUsdCents: null,
          mpbMaxPriceUsdCents: null,
        };
        const lines = [
          `Current MSRP: ${formatPrice(prices.msrpNowUsdCents)}`,
          `MSRP at launch: ${formatPrice(prices.msrpAtLaunchUsdCents)}`,
          `Max MPB observed: ${formatPrice(prices.mpbMaxPriceUsdCents)}`,
        ];
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/gear/${item.slug}`;
        return NextResponse.json({
          type: 4,
          data: {
            content: `Prices for ${item.name} (${item.brandName ?? ""})\n${lines.join(
              "\n",
            )}\n${url}`,
          },
        });
      }

      const searchText = (searchQueryFromSub ?? rootSearch) as
        | string
        | undefined;
      if (!searchText || String(searchText).trim().length === 0) {
        return NextResponse.json({
          type: 4,
          data: {
            content:
              "Provide search text: /gear search query:[text] or use /gear price query:[text]",
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }
      // Default behavior: basic search → top result link
      const searchResults = await searchGear({
        query: searchText,
        sort: "relevance",
        page: 1,
        pageSize: 1,
      });

      if (searchResults.results.length === 0) {
        return NextResponse.json({
          type: 4,
          data: {
            content: `No gear found for "${searchText}". Try a different search term.`,
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }

      const topResult = searchResults.results[0]!;
      const gearUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/gear/${topResult.slug}`;

      return NextResponse.json({
        type: 4,
        data: {
          content: `**${topResult.name}** by ${topResult.brandName}\n${gearUrl}`,
        },
      });
    } catch (error) {
      console.error("Error searching for gear:", error);
      return NextResponse.json({
        type: 4,
        data: {
          content:
            "Sorry, there was an error searching for gear. Please try again later.",
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    }
  },
};
