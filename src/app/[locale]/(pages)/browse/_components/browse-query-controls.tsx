"use client";

import { Suspense } from "react";
import { RefreshCcwDot } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { SortSelect } from "~/components/search/sort-select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useLocalePathnames } from "~/i18n/client";

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
              aria-label="Reset"
            >
              <RefreshCcwDot className="size-4" />
              <span className="sr-only">Reset</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset</TooltipContent>
        </Tooltip>
      ) : null}
      <SortSelect category={category} hasMount={hasMount} />
    </div>
  );
}

function BrowseQueryControlsFallback() {
  return (
    <div className="mb-2 flex items-center justify-end gap-2">
      <div className="border-input text-muted-foreground inline-flex h-10 w-[200px] items-center rounded-md border px-3 text-sm">
        Sort by
      </div>
    </div>
  );
}
