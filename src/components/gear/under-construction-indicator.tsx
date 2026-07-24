import { PencilRuler } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

type UnderConstructionIndicatorProps = {
  label: string;
  tooltip: string;
  variant: "badge" | "icon";
};

export function UnderConstructionIndicator({
  label,
  tooltip,
  variant,
}: UnderConstructionIndicatorProps) {
  if (variant === "badge") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="border-border bg-muted text-muted-foreground"
          >
            <PencilRuler className="text-muted-foreground" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={tooltip}
          className="inline-flex shrink-0 text-amber-600 outline-none dark:text-amber-400"
        >
          <PencilRuler className="size-4" aria-hidden />
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
