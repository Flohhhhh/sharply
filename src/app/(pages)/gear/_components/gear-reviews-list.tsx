"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface Review {
  id: string;
  content: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

interface GearReviewsListProps {
  gearSlug: string;
  onReviewsLoaded?: (count: number) => void;
}

export function GearReviewsList({
  gearSlug,
  onReviewsLoaded,
}: GearReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, [gearSlug, onReviewsLoaded]);

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
      <Card>
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
        <Card key={review.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">
                  {review.createdBy.name || "Anonymous"}
                </CardTitle>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
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
