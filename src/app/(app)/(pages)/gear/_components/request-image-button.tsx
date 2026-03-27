"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { actionToggleImageRequest } from "~/server/gear/actions";
import { toast } from "sonner";
import { ImagePlus, Check } from "lucide-react";

interface RequestImageButtonProps {
  slug: string;
  initialHasRequested: boolean | null;
}

export function RequestImageButton({
  slug,
  initialHasRequested,
}: RequestImageButtonProps) {
  const [hasRequested, setHasRequested] = useState(initialHasRequested ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrationCheckDone, setIsHydrationCheckDone] = useState(
    initialHasRequested !== null,
  );
  const [canRequestImage, setCanRequestImage] = useState(
    initialHasRequested !== null,
  );

  useEffect(() => {
    if (initialHasRequested !== null) {
      setCanRequestImage(true);
      setIsHydrationCheckDone(true);
      return;
    }

    let isCancelled = false;
    void (async () => {
      try {
        const response = await fetch(
          `/api/gear/${encodeURIComponent(slug)}/user-state`,
        );
        if (!response.ok) return;
        const payload = (await response.json()) as {
          hasImageRequest: boolean | null;
        };
        if (isCancelled) return;
        if (typeof payload.hasImageRequest === "boolean") {
          setCanRequestImage(true);
          setHasRequested(payload.hasImageRequest);
        } else {
          setCanRequestImage(false);
        }
      } catch {
        // Ignore background fetch failures; button remains hidden for signed-out users.
        if (!isCancelled) {
          setCanRequestImage(false);
        }
      } finally {
        if (!isCancelled) {
          setIsHydrationCheckDone(true);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [initialHasRequested, slug]);

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
