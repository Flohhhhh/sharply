"use client";

import { Check,ImagePlus } from "lucide-react";
import { useEffect,useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "~/components/ui/button";
import { fetchJson } from "~/lib/fetch-json";
import { actionToggleImageRequest } from "~/server/gear/actions";

interface RequestImageButtonProps {
  slug: string;
  initialHasRequested: boolean | null;
}

export function RequestImageButton({
  slug,
  initialHasRequested,
}: RequestImageButtonProps) {
  const [hasRequested, setHasRequested] = useState(
    initialHasRequested ?? false,
  );
  const [isLoading, setIsLoading] = useState(false);
  const shouldHydrateRequestState = initialHasRequested === null;
  const { data: requestStateData, error: requestStateError } = useSWR<{
    hasImageRequest: boolean | null;
  }>(
    shouldHydrateRequestState
      ? `/api/gear/${encodeURIComponent(slug)}/user-state`
      : null,
    (url: string) =>
      fetchJson<{
        hasImageRequest: boolean | null;
      }>(url, {
        credentials: "same-origin",
        cache: "no-store",
      }),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      shouldRetryOnError: false,
    },
  );

  useEffect(() => {
    if (typeof requestStateData?.hasImageRequest === "boolean") {
      setHasRequested(requestStateData.hasImageRequest);
    }
  }, [requestStateData?.hasImageRequest]);

  const isHydrationCheckDone =
    !shouldHydrateRequestState ||
    requestStateData !== undefined ||
    Boolean(requestStateError);
  const canRequestImage =
    !shouldHydrateRequestState ||
    typeof requestStateData?.hasImageRequest === "boolean";

  const handleToggle = async () => {
    if (hasRequested) {
      return;
    }
    setIsLoading(true);
    try {
      const result = await actionToggleImageRequest(slug, "add");

      if (result.ok && result.action === "added") {
        setHasRequested(true);
        toast.success("Image request submitted", {
          description:
            "Thanks for your interest! We'll prioritize adding an image for this item.",
        });
      } else if (!result.ok && result.reason === "already_requested") {
        setHasRequested(true);
        toast.error("Request already exists");
      } else {
        toast.error("Failed to submit request", {
          description: "Please try again later.",
        });
      }
    } catch (error) {
      console.error("Failed to toggle image request:", error);
      toast.error("Failed to submit request", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Keep the control hidden until we know whether the viewer is authenticated.
  if (!isHydrationCheckDone) {
    return null;
  }
  if (!canRequestImage) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {!hasRequested && (
        <span className="text-muted-foreground text-sm">
          Click below to help us prioritize this image!
        </span>
      )}

      <Button
        onClick={handleToggle}
        loading={isLoading}
        variant={hasRequested ? "outline" : "default"}
        disabled={hasRequested}
        size="sm"
        icon={
          hasRequested ? (
            <Check className="h-4 w-4" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )
        }
      >
        {hasRequested ? "Image Requested" : "Request Image"}
      </Button>
    </div>
  );
}
