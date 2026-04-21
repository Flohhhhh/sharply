import { Suspense } from "react";
import { TopComparePairs } from "../top-compare-pairs";
import { ImageRequestsList } from "./image-requests-list";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 px-8">
      {/* Image Requests */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">Image Requests</h2>
          <p className="text-muted-foreground mt-2">
            Gear items that users have requested images for, sorted by number of requests.
          </p>
        </div>
        <Suspense fallback={<div>Loading image requests...</div>}>
          <ImageRequestsList />
        </Suspense>
      </div>

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
