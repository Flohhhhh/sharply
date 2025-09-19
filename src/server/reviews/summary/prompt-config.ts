// Central, single surface for AI review summary prompt and model settings.
// Edit this file to tweak model, temperature, system instructions, or prompt wording.

export const SUMMARY_MODEL = "gpt-4.1-mini" as const;
export const SUMMARY_TEMPERATURE = 0.2 as const;

export const SUMMARY_SYSTEM_MESSAGE =
  "You are a concise editorial writing assistant with great but not overbearing vocabulary that writes technical and neutral buyer's guide blurbs about cameras based on aggregate user feedback." as const;

export type SummarizableReview = {
  content: string;
  recommend: boolean | null;
  genres: string[] | null;
};

export function buildSummaryPrompt(params: {
  gearName: string;
  previousSummary?: string | null;
  reviews: SummarizableReview[];
  maxCharsPerReview?: number; // defaults to 600
}): string {
  const { gearName, previousSummary, reviews } = params;
  const maxChars = Math.max(
    50,
    Math.min(2000, params.maxCharsPerReview ?? 600),
  );

  const header = `Summarize the following user reviews for the camera ${gearName}.
If a previous summary is provided, use it as context and update it to reflect the new reviews, while keeping earlier insights intact.

Avoid including technical specifications in the summary.

Write 2–4 sentences:
- What people typically recommend it for
- What strengths they mention
- What common complaints appear (not required if there are none)

Keep it natural and concise, like a buyer’s guide blurb. Try to keep it under 75 words as a loose limit.`;

  const prev = previousSummary
    ? `\n\nPrevious summary:\n${previousSummary}`
    : "";

  const lines: string[] = [];
  for (const r of reviews) {
    const trimmed = (r.content ?? "").slice(0, maxChars);
    const meta: string[] = [];
    if (r.recommend !== null)
      meta.push(r.recommend ? "[Recommends]" : "[Does not recommend]");
    if (r.genres?.length) meta.push(`[Genres: ${r.genres.join(", ")} ]`);
    const line = `${meta.join(" ")} ${trimmed}`.trim();
    if (line) lines.push(line);
  }
  const reviewsBlock = lines.map((l) => `- ${l}`).join("\n");
  return `${header}${prev}\n\nReviews (truncated where very long):\n${reviewsBlock}`;
}
