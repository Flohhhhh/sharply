"use client";

import { useEffect, useState } from "react";
import { GearReviewForm } from "./gear-review-form";
import { GearReviewsList } from "./gear-reviews-list";
import { Card, CardContent } from "~/components/ui/card";

export function GearReviews({ slug }: { slug: string }) {
  const [initialReviews, setInitialReviews] = useState<any[] | undefined>(
    undefined,
  );
  const [bannerHidden, setBannerHidden] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const [listRes, mineRes] = await Promise.all([
          fetch(`/api/gear/${slug}/reviews`),
          fetch(`/api/gear/${slug}/reviews?mine=1`),
        ]);
        const list = listRes.ok ? await listRes.json() : { reviews: [] };
        const mine = mineRes.ok ? await mineRes.json() : { hasReview: false };
        if (!mounted) return;
        setInitialReviews(list.reviews || []);
        setBannerHidden(Boolean(mine.hasReview));
      } catch {
        if (!mounted) return;
        setInitialReviews([]);
        setBannerHidden(false);
      }
    };
    run().catch((error) => {
      console.error("[GearReviews] error", error);
    });
    return () => {
      mounted = false;
    };
  }, [slug]);

  // Single loading skeleton for both
  if (initialReviews === undefined || bannerHidden === null) {
    return (
      <div className="mt-12 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Reviews</h3>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="bg-muted h-10 w-full animate-pulse rounded" />
              <div className="bg-muted h-24 w-full animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reviews</h3>
        {!bannerHidden && <span />}
      </div>
      {!bannerHidden && (
        <GearReviewForm
          gearSlug={slug}
          onReviewSubmitted={() => setBannerHidden(true)}
        />
      )}
      <GearReviewsList
        gearSlug={slug}
        initialReviews={initialReviews}
        showHeader={false}
      />
    </div>
  );
}

export default GearReviews;
