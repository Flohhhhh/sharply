import { NextResponse } from "next/server";
import { InteractionResponseFlags } from "discord-interactions";

export const compareCommand = {
  definition: {
    name: "compare",
    description: "Fetch a comparison between two provided gear items.",
    options: [
      {
        name: "one",
        description: "First gear (name or slug)",
        type: 3, // STRING
        required: true,
      },
      {
        name: "two",
        description: "Second gear (name or slug)",
        type: 3, // STRING
        required: true,
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
    const optionsRaw = (interaction?.data)?.options as
      | CommandOption[]
      | undefined;
    const opt: CommandOption[] = Array.isArray(optionsRaw) ? optionsRaw : [];
    const first = opt.find((o) => o.name === "one")?.value as
      | string
      | undefined;
    const second = opt.find((o) => o.name === "two")?.value as
      | string
      | undefined;

    if (!first || !second) {
      return NextResponse.json({
        type: 4,
        data: {
          content: "Provide two gear queries: /compare one:[query] two:[query]",
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    }

    try {
      const { searchGear } = await import("~/server/search/service");
      const { buildCompareHref } = await import("~/lib/utils/url");

      const [a, b] = await Promise.all([
        searchGear({ query: first, sort: "relevance", page: 1, pageSize: 1 }),
        searchGear({ query: second, sort: "relevance", page: 1, pageSize: 1 }),
      ]);

      const aTop = a.results[0];
      const bTop = b.results[0];

      if (!aTop || !bTop) {
        return NextResponse.json({
          type: 4,
          data: {
            content: "Could not resolve both items. Try more specific queries.",
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }

      const href = buildCompareHref([aTop.slug, bTop.slug]);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}${href}`;
      return NextResponse.json({
        type: 4,
        data: { content: `Compare: ${aTop.name} vs ${bTop.name}\n${url}` },
      });
    } catch (err) {
      console.error("/compare error", err);
      return NextResponse.json({
        type: 4,
        data: {
          content: "Error generating compare link.",
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    }
  },
};
