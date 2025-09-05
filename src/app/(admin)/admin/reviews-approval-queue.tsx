"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

type ReviewItem = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  content: string;
  genres: string[] | null;
  recommend: boolean | null;
  createdAt: string;
  userId: string | null;
  userName: string | null;
  gearId: string | null;
  gearName: string | null;
  gearSlug: string | null;
};

export function ReviewsApprovalQueue() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const pending = useMemo(
    () => items.filter((r) => r.status === "PENDING"),
    [items],
  );
  const resolved = useMemo(
    () => items.filter((r) => r.status !== "PENDING"),
    [items],
  );

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const { fetchAdminReviews } = await import(
        "~/server/admin/reviews/service"
      );
      const rows = await fetchAdminReviews();
      setItems(rows as unknown as ReviewItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const act = async (id: string, action: "approve" | "reject") => {
    const { actionApproveReview, actionRejectReview } = await import(
      "~/server/admin/reviews/actions"
    );
    if (action === "approve") await actionApproveReview(id);
    else await actionRejectReview(id);
    await refresh();
  };

  if (loading) return <div className="py-6 text-center">Loading…</div>;
  if (error)
    return (
      <div className="text-destructive py-6 text-center text-sm">{error}</div>
    );

  return (
    <div className="space-y-4">
      {/* Pending */}
      <div className="space-y-3">
        {pending.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              No pending reviews.
            </CardContent>
          </Card>
        ) : (
          pending.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={r.gearSlug ? `/gear/${r.gearSlug}` : "#"}
                        className="hover:underline"
                      >
                        {r.gearName ?? "(Unknown Gear)"}
                      </a>
                      <Badge variant="secondary">PENDING</Badge>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      by {r.userName ?? r.userId ?? "User"} •{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                    {r.genres && r.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {r.genres.map((g) => (
                          <span
                            key={g}
                            className="bg-muted rounded px-2 py-0.5 text-xs"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-sm">{r.content}</div>
                  </div>
                  <div className="flex-shrink-0 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => act(r.id, "reject")}
                    >
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => act(r.id, "approve")}>
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Resolved */}
      <div>
        <div className="text-muted-foreground mb-2 text-sm">
          {resolved.length} resolved
        </div>
        <div className="space-y-2">
          {resolved.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={r.gearSlug ? `/gear/${r.gearSlug}` : "#"}
                        className="hover:underline"
                      >
                        {r.gearName ?? "(Unknown Gear)"}
                      </a>
                      <Badge
                        variant={
                          r.status === "APPROVED" ? "default" : "destructive"
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      by {r.userName || r.userId || "User"} •{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm">{r.content}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReviewsApprovalQueue;
