"use client";

import { track } from "@vercel/analytics";
import { useMemo, useState } from "react";
import { useSession } from "~/lib/auth/auth-client";
import { Button } from "~/components/ui/button";
import { TextareaWithCounter } from "~/components/ui/textarea-with-counter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { GENRES } from "~/lib/constants";
import React from "react";
import { Pencil } from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";

interface GearReviewFormProps {
  gearSlug: string;
  onReviewSubmitted?: () => void;
  refreshSignal?: number;
}

export function GearReviewForm({
  gearSlug,
  onReviewSubmitted,
  refreshSignal = 0,
}: GearReviewFormProps) {
  const { data, isPending } = useSession();

  const session = data?.session;

  const callbackUrl = `/gear/${gearSlug}`;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // User Review composer state
  const [open, setOpen] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const [recommend, setRecommend] = useState<"YES" | "NO" | null>(null);

  // Pre-check if the user already has a review
  React.useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/gear/${gearSlug}/reviews?mine=1`);
        if (res.ok) {
          const data = await res.json();
          setHasSubmitted(Boolean(data.hasReview));
        } else {
          setHasSubmitted(false);
        }
      } catch {
        setHasSubmitted(false);
      }
    };
    if (session)
      run().catch((error) => {
        console.error("[GearReviewForm] error", error);
      });
    else if (!session) setHasSubmitted(false);
  }, [gearSlug, session, refreshSignal]);

  const formValid = useMemo(() => {
    if (genres.length < 1 || genres.length > 3) return false;
    if (!recommend) return false;
    return true;
  }, [genres, recommend]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError("");
    setSuccess("");
    void track("review_submit_attempt", {
      gearSlug,
      genresCount: genres.length,
    });

    try {
      const response = await fetch(`/api/gear/${gearSlug}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          genres,
          recommend: recommend === "YES",
          clientUserAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        }),
      });

      const data = (await response.json()) as
        | {
            ok: true;
            moderation: { decision: "APPROVED" };
          }
        | {
            ok: false;
            type: "ALREADY_REVIEWED";
            message: string;
          }
        | {
            ok: false;
            type: "MODERATION_BLOCKED";
            code:
              | "REVIEW_TOO_SHORT"
              | "REVIEW_LINK_BLOCKED"
              | "REVIEW_PROFANITY_BLOCKED"
              | "REVIEW_BOT_UA_BLOCKED"
              | "REVIEW_RATE_LIMITED";
            message: string;
            retryAfterMs?: number;
          };

      if (!data.ok) {
        if (data.type === "MODERATION_BLOCKED") {
          const waitSuffix =
            data.code === "REVIEW_RATE_LIMITED" &&
            typeof data.retryAfterMs === "number"
              ? ` Try again in ${formatRetryDuration(data.retryAfterMs)}.`
              : "";
          setError(`${data.message}${waitSuffix}`);
          return;
        }

        setError(data.message || "Failed to submit review.");
        return;
      }

      if (!response.ok) {
        setError("Failed to submit review.");
        return;
      }

      setSuccess("Review published successfully.");
      setContent("");
      // reset composer
      setGenres([]);
      setRecommend(null);
      setOpen(false);

      setHasSubmitted(true);
      onReviewSubmitted?.();
    } catch {
      setError("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCtaClick = () => {
    if (isPending) return;
    void track("review_cta_click", {
      gearSlug,
      authenticated: Boolean(session),
    });
    if (session) {
      setOpen(true);
    } else {
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    }
  };

  // Always render a single CTA; behavior changes based on auth state

  if (hasSubmitted) {
    return null;
  }

  return (
    <div className="mb-4">
      {/* Banner + Trigger */}
      <div className="flex w-full flex-col items-start justify-between gap-2 rounded-md border p-3 sm:flex-row sm:items-center">
        <div className="sm:blocktext-sm hidden">
          Share your experience to help others decide.
        </div>
        <Button
          onClick={handleCtaClick}
          loading={isPending}
          icon={<Pencil className="h-4 w-4" />}
          className="w-full sm:w-fit"
        >
          Write a Review
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Review</DialogTitle>
              <DialogDescription>
                Write a short review of your personal experience with this gear,
                address how its performance compares to your expectations, what
                you like about it, and what you wish could be improved.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Genres (simple checkbox list, max 3) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  What do you use it for?
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(GENRES as any[]).map((g) => {
                    const checked = genres.includes(
                      (g.slug as string) ?? (g.id as string),
                    );
                    const disabled = !checked && genres.length >= 3;
                    return (
                      <label
                        key={(g.id as string) ?? (g.slug as string)}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (genres.length < 3)
                                setGenres([
                                  ...genres,
                                  ((g.slug as string) ?? (g.id as string))!,
                                ]);
                            } else {
                              const key =
                                (g.slug as string) ?? (g.id as string);
                              setGenres(genres.filter((id) => id !== key));
                            }
                          }}
                        />
                        <span>{(g.name as string) ?? (g.slug as string)}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="text-muted-foreground text-xs">
                  Select up to 3.
                </div>
              </div>

              {/* Recommend (radio) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Would you recommend this to people like you?
                </label>
                <RadioGroup
                  value={recommend ?? undefined}
                  onValueChange={(v) =>
                    setRecommend((v as "YES" | "NO") ?? null)
                  }
                  className="flex gap-4"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value="YES" />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value="NO" />
                    <span>No</span>
                  </label>
                </RadioGroup>
              </div>

              {/* Freeform content */}
              <div>
                <label
                  htmlFor="content"
                  className="mb-2 block text-sm font-medium"
                >
                  Your Review
                </label>
                <TextareaWithCounter
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your experience..."
                  rows={6}
                  required
                  maxLength={600}
                />
              </div>

              {/* Error/Success */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !formValid}>
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function formatRetryDuration(retryAfterMs: number) {
  const totalSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const totalMinutes = Math.ceil(totalSeconds / 60);
  return `${totalMinutes}m`;
}
