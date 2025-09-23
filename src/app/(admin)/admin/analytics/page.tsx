import { Suspense } from "react";
import { TopComparePairs } from "../top-compare-pairs";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 px-8">
      {/* Top Compare Pairs */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">Top Comparison Pairs</h2>
          <p className="text-muted-foreground mt-2">
            Most frequently compared gear pairs (lifetime counter).
          </p>
        </div>
        <Suspense fallback={<div>Loading compare pairs...</div>}>
          <TopComparePairs />
        </Suspense>
      </div>
    </div>
  );
}
