"use client";

import { RefreshCcwDot } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { SortSelect } from "~/components/search/sort-select";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasQueryParams = searchParams.toString().length > 0;

  const handleReset = () => {
    if (!hasQueryParams) return;
    window.history.pushState(null, "", pathname);
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
