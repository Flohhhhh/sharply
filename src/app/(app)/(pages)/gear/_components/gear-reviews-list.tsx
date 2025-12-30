"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { GENRES } from "~/lib/constants";
import Link from "next/link";

interface Review {
  id: string;
  content: string;
  genres?: string[] | null;
  recommend?: boolean | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    handle: string | null;
    memberNumber: number;
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
      <div className="mt-4 rounded border py-12 text-sm">
        <div className="p-6">
          <div className="text-center text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="mt-4 rounded border py-12 text-sm">
        <div className="p-6">
          <div className="text-muted-foreground text-center">
            No reviews yet. Be the first to review this gear!
          </div>
        </div>
      </div>
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
        const hasGenres =
          Array.isArray(review.genres) && review.genres.length > 0;
        return (
          <div
            key={review.id}
            className="border-border bg-background/95 rounded-xl border shadow-sm"
          >
            <div className="space-y-3 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
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
                    <Link
                      href={`/u/${review.createdBy.handle || `user-${review.createdBy.memberNumber}`}`}
                      className="hover:underline"
                    >
                      <p className="truncate text-sm font-semibold">
                        {review.createdBy.name || "Anonymous"}
                      </p>
                    </Link>
                    {hasGenres ? null : (
                      <p className="text-muted-foreground text-xs">
                        Shared a review
                      </p>
                    )}
                  </div>
                </div>
                {review.recommend != null && (
                  <Badge
                    variant="secondary"
                    className={`border-0 px-3 py-1 text-[11px] font-semibold tracking-wide uppercase ${
                      review.recommend
                        ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20"
                        : "bg-red-500/15 text-red-500 hover:bg-red-500/20"
                    }`}
                  >
                    {review.recommend ? "Recommended" : "Not Recommended"}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {review.content}
              </p>
            </div>
            <div className="text-muted-foreground border-t px-5 py-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-foreground/80 font-medium">
                  {formattedDate}
                </span>
                <span className="text-muted-foreground/60">-</span>
                {hasGenres ? (
                  <div className="flex flex-wrap gap-1">
                    {review.genres!.map((gid) => {
                      const match = (GENRES as any[]).find(
                        (g) =>
                          (g.slug as string) === gid ||
                          (g.id as string) === gid,
                      );
                      const label = (match?.name as string) ?? gid;
                      return (
                        <Badge key={gid} className="text-[10px]">
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <span>No genres noted</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
