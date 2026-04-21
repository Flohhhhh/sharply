/*
These tests protect how review summaries are built before they are sent to AI.
They check plain things: old summary context, truncation, review tags, and empty review handling.
This helps prevent bad prompts that can produce poor or unsafe summaries.
*/

import { describe,expect,it } from "vitest";
import { buildSummaryPrompt } from "~/server/reviews/summary/prompt-config";

describe("review summary prompt builder", () => {
  it("includes previous summary only when provided", () => {
    const withPrevious = buildSummaryPrompt({
      gearName: "Nikon Z6 III",
      previousSummary: "Existing summary text.",
      reviews: [{ content: "Great autofocus.", recommend: true, genres: null }],
    });
    expect(withPrevious).toContain("Previous summary:\nExisting summary text.");

    const withoutPrevious = buildSummaryPrompt({
      gearName: "Nikon Z6 III",
      reviews: [{ content: "Great autofocus.", recommend: true, genres: null }],
    });
    expect(withoutPrevious).not.toContain("Previous summary:");
  });

  it("truncates long review content to the configured max chars", () => {
    const longReview = `${"1234567890".repeat(6)}TAIL`;
    const expectedTrimmed = longReview.slice(0, 50);
    const prompt = buildSummaryPrompt({
      gearName: "Canon R6",
      maxCharsPerReview: 50,
      reviews: [
        {
          content: longReview,
          recommend: null,
          genres: null,
        },
      ],
    });

    expect(prompt).toContain(`- ${expectedTrimmed}`);
    expect(prompt).not.toContain("TAIL");
  });

  it("adds recommend and genre tags to review lines", () => {
    const prompt = buildSummaryPrompt({
      gearName: "Sony A7 IV",
      reviews: [
        {
          content: "Great for portraits.",
          recommend: true,
          genres: ["portrait", "street"],
        },
        {
          content: "Did not enjoy the menu.",
          recommend: false,
          genres: null,
        },
      ],
    });

    expect(prompt).toContain("[Recommends] [Genres: portrait, street ]");
    expect(prompt).toContain("[Does not recommend]");
  });

  it("skips empty review lines with no content and no tags", () => {
    const prompt = buildSummaryPrompt({
      gearName: "Fujifilm X-T5",
      reviews: [
        { content: "   ", recommend: null, genres: null },
        { content: "Useful in travel.", recommend: true, genres: null },
      ],
    });

    const reviewsSection = prompt.split("Reviews (truncated where very long):\n")[1] ?? "";
    const bulletLines = reviewsSection.match(/^- /gm) ?? [];
    expect(bulletLines).toHaveLength(1);
  });
});
