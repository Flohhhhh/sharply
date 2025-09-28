import { NextResponse } from "next/server";
import { InteractionResponseFlags } from "discord-interactions";
import { searchGear } from "~/server/search/service";

export const getGearCommand = {
  definition: {
    name: "gear",
    description: "Search for gear and get the highest scoring result",
    options: [
      {
        name: "search",
        description: "Search text for gear",
        type: 3, // STRING
        required: true,
      },
    ],
  },
  handler: async (interaction: any) => {
    const searchText = interaction.data.options?.[0]?.value;

    if (!searchText) {
      return NextResponse.json({
        type: 4,
        data: {
          content: "Please provide search text for the gear command.",
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    }

    try {
      // Search for gear using the common search method
      const searchResults = await searchGear({
        query: searchText,
        sort: "relevance",
        page: 1,
        pageSize: 1, // Only get the top result
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
