"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { REVIEW_GENRES } from "~/lib/constants";

interface Review {
  id: string;
  content: string;
  genres?: string[] | null;
  recommend?: boolean | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    image?: string | null;
  };
}

interface GearReviewsListProps {
  gearSlug: string;
  onReviewsLoaded?: (count: number) => void;
  initialReviews?: Review[];
}

export function GearReviewsList({
  gearSlug,
  onReviewsLoaded,
  initialReviews,
}: GearReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews ?? []);
  const [isLoading, setIsLoading] = useState(!initialReviews);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialReviews) {
      onReviewsLoaded?.(initialReviews.length);
      return;
    }
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/gear/${gearSlug}/reviews`);
        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const data = await response.json();
        setReviews(data.reviews || []);
        onReviewsLoaded?.(data.reviews?.length || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reviews");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, [gearSlug, onReviewsLoaded, initialReviews]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-muted-foreground text-center">
            Loading reviews...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6">
          <div className="text-muted-foreground text-center">
            No reviews yet. Be the first to review this gear!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>
      </div>

      {reviews.map((review) => (
        <Card key={review.id} className="rounded-md shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarImage
                      src={review.createdBy.image ?? undefined}
                      alt={review.createdBy.name ?? "User"}
                    />
                    <AvatarFallback>
                      {(review.createdBy.name || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="truncate text-base">
                    {review.createdBy.name || "Anonymous"}
                  </CardTitle>
                </div>
                {review.recommend != null && (
                  <div className="mt-1 text-xs font-medium">
                    <span
                      className={
                        review.recommend ? "text-emerald-600" : "text-red-600"
                      }
                    >
                      {review.recommend ? "Recommended" : "Not Recommended"}
                    </span>
                  </div>
                )}
                {Array.isArray(review.genres) && review.genres.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {review.genres.map((gid) => {
                      const match = REVIEW_GENRES.find((g) => g.id === gid);
                      const label = match?.name ?? gid;
                      return (
                        <Badge
                          key={gid}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="text-muted-foreground flex-shrink-0 text-sm">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-muted-foreground text-sm">{review.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
