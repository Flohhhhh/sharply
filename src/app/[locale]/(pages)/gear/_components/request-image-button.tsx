"use client";

import { Check, ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "~/components/ui/button";
import { fetchJson } from "~/lib/fetch-json";
import { actionToggleImageRequest } from "~/server/gear/actions";
import { resolveRequestImageButtonState } from "./request-image-button-state";

interface RequestImageButtonProps {
  slug: string;
  initialHasRequested: boolean | null;
}

export function RequestImageButton({
  slug,
  initialHasRequested,
}: RequestImageButtonProps) {
  const t = useTranslations("gearDetail.imageRequest");
  const [optimisticHasRequested, setOptimisticHasRequested] = useState<
    boolean | null
  >(null);
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
  const renderState = resolveRequestImageButtonState({
    initialHasRequested,
    hydratedHasRequested: requestStateData?.hasImageRequest,
    hasHydrationError: Boolean(requestStateError),
    optimisticHasRequested,
  });

  const handleToggle = async () => {
    if (renderState.hasRequested) {
      return;
    }
    setIsLoading(true);
    try {
      const result = await actionToggleImageRequest(slug, "add");

      if (result.ok && result.action === "added") {
        setOptimisticHasRequested(true);
        toast.success(t("toastSubmittedTitle"), {
          description: t("toastSubmittedDescription"),
        });
      } else if (!result.ok && result.reason === "already_requested") {
        setOptimisticHasRequested(true);
        toast.error(t("toastAlreadyRequestedTitle"));
      } else {
        toast.error(t("toastFailedTitle"), {
          description: t("toastFailedDescription"),
        });
      }
    } catch (error) {
      console.error("Failed to toggle image request:", error);
      toast.error(t("toastFailedTitle"), {
        description: t("toastFailedDescription"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!renderState.shouldRender) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {renderState.shouldShowHelper && (
        <span className="text-muted-foreground text-sm">{t("helper")}</span>
      )}

      <Button
        onClick={handleToggle}
        loading={isLoading}
        variant={renderState.hasRequested ? "outline" : "default"}
        disabled={renderState.hasRequested}
        size="sm"
        icon={
          renderState.hasRequested ? (
            <Check className="h-4 w-4" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )
        }
      >
        {renderState.hasRequested ? t("requested") : t("button")}
      </Button>
    </div>
  );
}
