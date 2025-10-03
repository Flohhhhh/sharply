import "server-only";

import { fetchReviewSummary } from "~/server/reviews/summary/service";
import { Sparkles } from "lucide-react";

export async function AiReviewBanner({ gearId }: { gearId: string }) {
  const summary = await fetchReviewSummary(gearId);
  if (!summary) return null;
  return (
    <div className="rounded-md border border-indigo-300/50 bg-indigo-50/60 p-4 text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-100">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-indigo-600 dark:text-indigo-300">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold tracking-wide text-indigo-700 uppercase dark:text-indigo-200">
            AI Review Summary
          </div>
          <p className="text-sm leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  );
}
