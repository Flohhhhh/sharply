"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { GENRES } from "~/lib/constants";

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
  showHeader?: boolean;
}

export function GearReviewsList({
  gearSlug,
  onReviewsLoaded,
  initialReviews,
  showHeader = true,
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
    fetchReviews().catch((error) => {
      console.error("[GearReviewsList] error", error);
    });
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
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>
        </div>
      )}

      {reviews.map((review) => {
        const createdAt = new Date(review.createdAt);
        const formattedDate = Number.isNaN(createdAt.getTime())
          ? review.createdAt
          : createdAt.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
        const hasGenres = Array.isArray(review.genres) && review.genres.length > 0;
        return (
          <Card
            key={review.id}
            className="rounded-xl border border-border bg-background shadow-none"
          >
            <CardContent className="space-y-4 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarImage
                      src={review.createdBy.image ?? undefined}
                      alt={review.createdBy.name ?? "User"}
                    />
                    <AvatarFallback>
                      {(review.createdBy.name || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {review.createdBy.name || "Anonymous"}
                    </CardTitle>
                    {hasGenres ? null : (
                      <p className="text-muted-foreground text-xs">
                        Shared a review
                      </p>
                    )}
                  </div>
                </div>
                {review.recommend != null && (
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      review.recommend
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {review.recommend ? "Recommended" : "Not Recommended"}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {review.content}
              </p>
            </CardContent>
            <CardFooter className="border-t flex-wrap justify-between gap-3 px-6 py-4 text-xs text-muted-foreground">
              <div className="flex flex-wrap gap-2">
                {hasGenres
                  ? review.genres!.map((gid) => {
                      const match = (GENRES as any[]).find(
                        (g) =>
                          (g.slug as string) === gid ||
                          (g.id as string) === gid,
                      );
                      const label = (match?.name as string) ?? gid;
                      return (
                        <Badge
                          key={gid}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {label}
                        </Badge>
                      );
                    })
                  : (
                      <span>No genres noted</span>
                    )}
              </div>
              <span className="whitespace-nowrap">{formattedDate}</span>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
