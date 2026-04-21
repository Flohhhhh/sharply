"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { GENRES } from "~/lib/constants";
import Link from "next/link";
import { useSession } from "~/lib/auth/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { EllipsisVertical, Flag, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { toast } from "sonner";

const REVIEWS_PER_PAGE = 5;

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
  refreshSignal?: number;
  onReviewDeleted?: () => void;
}

export function GearReviewsList({
  gearSlug,
  onReviewsLoaded,
  initialReviews,
  showHeader = true,
  refreshSignal = 0,
  onReviewDeleted,
}: GearReviewsListProps) {
  const { data } = useSession();
  const session = data?.session;
  const user = data?.user;
  const [reviews, setReviews] = useState<Review[]>(initialReviews ?? []);
  const [isLoading, setIsLoading] = useState(!initialReviews);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = useMemo(
    () => Math.ceil(reviews.length / REVIEWS_PER_PAGE),
    [reviews.length],
  );

  const paginatedReviews = useMemo(() => {
    const startIndex = currentPage * REVIEWS_PER_PAGE;
    return reviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);
  }, [reviews, currentPage]);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 0 || (totalPages > 0 && nextPage >= totalPages)) return;
    setCurrentPage(nextPage);
  };

  useEffect(() => {
    if (initialReviews && refreshSignal === 0) {
      onReviewsLoaded?.(initialReviews.length);
      return;
    }
    const fetchReviews = async () => {
      setIsLoading(true);
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
  }, [gearSlug, onReviewsLoaded, initialReviews, refreshSignal]);

  useEffect(() => {
    if (currentPage < totalPages) return;
    setCurrentPage(Math.max(totalPages - 1, 0));
  }, [currentPage, totalPages]);

  const handleFlagReview = async (review: Review) => {
    if (!session) {
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(
        `/gear/${gearSlug}`,
      )}`;
      return;
    }

    if (user?.id === review.createdBy.id) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        ok: boolean;
        type?: string;
        message?: string;
      };

      if (response.ok && data.ok) {
        toast.success("Thanks. This review was flagged for moderation.");
        return;
      }

      if (data.type === "FLAG_ALREADY_OPEN") {
        toast.info("You already have an open flag for this review.");
        return;
      }

      toast.error(data.message || "Unable to flag review.");
    } catch {
      toast.error("Unable to flag review.");
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reviews/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        toast.error(data.message || "Unable to delete review.");
        return;
      }

      setReviews((prev) => prev.filter((review) => review.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Review deleted.");
      onReviewDeleted?.();
    } catch {
      toast.error("Unable to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

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

      {paginatedReviews.map((review) => {
        const isOwnReview = user?.id === review.createdBy.id;
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
                <div className="flex items-center gap-1">
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Review actions"
                      >
                        <EllipsisVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-44">
                      {isOwnReview ? (
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteTarget(review)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete review
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onSelect={() => void handleFlagReview(review)}
                        >
                          <Flag className="h-3.5 w-3.5" />
                          Flag for moderation
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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

      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  handlePageChange(currentPage - 1);
                }}
                aria-disabled={currentPage === 0}
                className={
                  currentPage === 0
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>

            {buildPaginationItems(currentPage, totalPages).map((item, idx) => {
              if (item === "ellipsis") {
                return (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              const pageIndex = item;
              return (
                <PaginationItem key={pageIndex}>
                  <PaginationLink
                    href="#"
                    isActive={pageIndex === currentPage}
                    onClick={(event) => {
                      event.preventDefault();
                      handlePageChange(pageIndex);
                    }}
                  >
                    {pageIndex + 1}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  handlePageChange(currentPage + 1);
                }}
                aria-disabled={
                  totalPages === 0 || currentPage + 1 >= totalPages
                }
                className={
                  totalPages === 0 || currentPage + 1 >= totalPages
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your review?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your review from the gear page and your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget ? (
            <p className="text-muted-foreground rounded-md border p-3 text-sm">
              {deleteTarget.content}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteReview();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Build pagination items with ellipsis for large page counts.
 * Always shows first page, last page, and a few pages around the current page.
 */
function buildPaginationItems(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  // For small page counts, just show all pages
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const items: Array<number | "ellipsis"> = [];

  // Always add first page
  items.push(0);

  // Add ellipsis or pages near the start
  if (currentPage > 2) {
    items.push("ellipsis");
  } else if (currentPage === 2) {
    items.push(1);
  }

  // Add pages around current page
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages - 2, currentPage + 1);
  for (let i = start; i <= end; i++) {
    if (!items.includes(i)) {
      items.push(i);
    }
  }

  // Add ellipsis or pages near the end
  if (currentPage < totalPages - 3) {
    items.push("ellipsis");
  } else if (currentPage === totalPages - 3) {
    items.push(totalPages - 2);
  }

  // Always add last page
  if (!items.includes(totalPages - 1)) {
    items.push(totalPages - 1);
  }

  return items;
}
