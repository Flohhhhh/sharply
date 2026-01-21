"use client";

import { useState } from "react";
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
  const [hasRequested, setHasRequested] = useState(
    initialHasRequested ?? false,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const action = hasRequested ? "remove" : "add";
      const result = await actionToggleImageRequest(slug, action);

      if (result.ok) {
        if (result.action === "added") {
          setHasRequested(true);
          toast.success("Image request submitted", {
            description:
              "Thanks for your interest! We'll prioritize adding an image for this item.",
          });
        } else {
          setHasRequested(false);
          toast.success("Image request removed");
        }
      } else {
        toast.error("Request already exists");
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

  // Don't show button if user is not logged in
  if (initialHasRequested === null) {
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
