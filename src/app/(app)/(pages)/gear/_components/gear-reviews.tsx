"use client";

import { useEffect, useState } from "react";
import { GearReviewForm } from "./gear-review-form";
import { GearReviewsList } from "./gear-reviews-list";
import { Card, CardContent } from "~/components/ui/card";

export function GearReviews({
  slug,
  bannerSlot,
}: {
  slug: string;
  bannerSlot?: React.ReactNode;
}) {
  const [initialReviews, setInitialReviews] = useState<any[] | undefined>(
    undefined,
  );
  const [refreshSignal, setRefreshSignal] = useState(0);

  const triggerRefresh = () => setRefreshSignal((prev) => prev + 1);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const listRes = await fetch(`/api/gear/${slug}/reviews`);
        const list = listRes.ok ? await listRes.json() : { reviews: [] };
        if (!mounted) return;
        setInitialReviews(list.reviews || []);
      } catch {
        if (!mounted) return;
        setInitialReviews([]);
      }
    };
    run().catch((error) => {
      console.error("[GearReviews] error", error);
    });
    return () => {
      mounted = false;
    };
  }, [slug]);

  return (
    <div className="mt-12 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reviews</h3>
        <span />
      </div>
      {bannerSlot}
      <GearReviewForm
        gearSlug={slug}
        onReviewSubmitted={triggerRefresh}
        refreshSignal={refreshSignal}
      />
      {initialReviews === undefined ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="bg-muted h-6 w-1/3 animate-pulse rounded" />
              <div className="bg-muted h-24 w-full animate-pulse rounded" />
              <div className="bg-muted h-24 w-full animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <GearReviewsList
          gearSlug={slug}
          initialReviews={initialReviews}
          showHeader={false}
          refreshSignal={refreshSignal}
          onReviewDeleted={triggerRefresh}
        />
      )}
    </div>
  );
}

export default GearReviews;
