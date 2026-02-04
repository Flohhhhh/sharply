"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Empty, EmptyDescription, EmptyTitle } from "~/components/ui/empty";
import Link from "next/link";
import { useCountry } from "~/lib/hooks/useCountry";
import { GetGearDisplayName } from "~/lib/gear/naming";
import type { GearAlias } from "~/types/gear";

interface UserReview {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  gearId: string;
  gearSlug: string;
  gearName: string;
  regionalAliases?: GearAlias[] | null;
  gearType: string;
  brandName: string | null;
}

type UserReviewsResponse = {
  reviews: UserReview[];
};

function isUserReviewsResponse(value: unknown): value is UserReviewsResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { reviews?: unknown }).reviews)
  );
}

export function UserReviewsList({
  userId,
  isCurrentUser = false,
  profileName,
}: {
  userId?: string;
  isCurrentUser?: boolean;
  profileName?: string | null;
}) {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { region } = useCountry();

  useEffect(() => {
    const fetchUserReviews = async () => {
      try {
        const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
        const response = await fetch(`/api/user/reviews${qs}`);
        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }

        const data: unknown = await response.json();
        if (isUserReviewsResponse(data)) {
          setReviews(data.reviews);
        } else {
          setReviews([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reviews");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUserReviews();
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-muted-foreground text-center">
            Loading your reviews...
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
    const displayName = profileName?.trim() || "This user";
    const emptyTitle = isCurrentUser
      ? "You haven't written any reviews yet"
      : `${displayName} hasn't written any reviews yet`;
    const emptyDescription = isCurrentUser
      ? "Start reviewing gear you've used to help other photographers."
      : "Check back later to see their thoughts on gear they've used.";

    return (
      <Empty className="border-border rounded-lg border-2 border-dashed p-8">
        <EmptyTitle>{emptyTitle}</EmptyTitle>
        <EmptyDescription>{emptyDescription}</EmptyDescription>
      </Empty>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Approved";
      case "PENDING":
        return "Pending Review";
      case "REJECTED":
        return "Rejected";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>
      </div>

      {reviews.map((review) => {
        const displayName = GetGearDisplayName(
          {
            name: review.gearName,
            regionalAliases: review.regionalAliases ?? [],
          },
          { region },
        );
        return (
          <Card key={review.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Link
                      href={`/gear/${review.gearSlug}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {review.brandName} {displayName}
                    </Link>
                    <Badge variant="outline" className="text-xs">
                      {review.gearType}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      className={`text-xs ${getStatusColor(review.status)}`}
                    >
                      {getStatusText(review.status)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="text-xs">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground text-sm">{review.content}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
