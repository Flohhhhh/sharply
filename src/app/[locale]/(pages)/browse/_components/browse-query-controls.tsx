"use client";

import { RefreshCcwDot } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname,useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SortSelect } from "~/components/search/sort-select";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

type BrowseQueryControlsProps = {
  category?: "cameras" | "lenses" | null;
  hasMount?: boolean;
};

export function BrowseQueryControls({
  category,
  hasMount,
}: BrowseQueryControlsProps) {
  return (
    <Suspense fallback={<BrowseQueryControlsFallback />}>
      <BrowseQueryControlsContent category={category} hasMount={hasMount} />
    </Suspense>
  );
}

function BrowseQueryControlsContent({
  category,
  hasMount,
}: BrowseQueryControlsProps) {
  const t = useTranslations("browsePage");
  const rawPathname = usePathname();
  const searchParams = useSearchParams();
  const hasQueryParams = searchParams.toString().length > 0;

  const handleReset = () => {
    if (!hasQueryParams) return;
    window.history.pushState(null, "", rawPathname);
  };

  return (
    <div className="mb-2 flex items-center justify-end gap-2">
      {hasQueryParams ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleReset}
              aria-label={t("reset")}
            >
              <RefreshCcwDot className="size-4" />
              <span className="sr-only">{t("reset")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("reset")}</TooltipContent>
        </Tooltip>
      ) : null}
      <SortSelect category={category} hasMount={hasMount} />
    </div>
  );
}

function BrowseQueryControlsFallback() {
  const t = useTranslations("browsePage");
  return (
    <div className="mb-2 flex items-center justify-end gap-2">
      <div className="border-input text-muted-foreground inline-flex h-10 w-[200px] items-center rounded-md border px-3 text-sm">
        {t("sortBy")}
      </div>
    </div>
  );
}
