"use client";

import { LockKeyhole } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export function CompletedSpecLock({ message }: { message: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={message}
          className="text-muted-foreground inline-flex size-4 shrink-0 items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          type="button"
        >
          <LockKeyhole aria-hidden className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{message}</TooltipContent>
    </Tooltip>
  );
}
