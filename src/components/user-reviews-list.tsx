"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";

interface UserReview {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  gear: {
    id: string;
    slug: string;
    name: string;
    gearType: string;
    brand: {
      name: string;
    };
  };
}

export function UserReviewsList() {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserReviews = async () => {
      try {
        const response = await fetch("/api/user/reviews");
        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }

        const data = await response.json();
        setReviews(data.reviews || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reviews");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserReviews();
  }, []);

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
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-muted-foreground text-center">
            <p className="mb-2">You haven't written any reviews yet.</p>
            <p className="text-sm">
              Start reviewing gear you've used to help other photographers!
            </p>
          </div>
        </CardContent>
      </Card>
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
        <h3 className="text-lg font-semibold">
          Your Reviews ({reviews.length})
        </h3>
      </div>

      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Link
                    href={`/gear/${review.gear.slug}`}
                    className="text-primary font-medium hover:underline"
                  >
                    {review.gear.brand.name} {review.gear.name}
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {review.gear.gearType}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className={`text-xs ${getStatusColor(review.status)}`}>
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
      ))}
    </div>
  );
}
