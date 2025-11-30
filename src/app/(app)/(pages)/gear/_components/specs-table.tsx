import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { InfoIcon } from "lucide-react";
import { SpecsMissingNote } from "./specs-missing-note";
import type { GearItem } from "~/types/gear";
import { cn } from "~/lib/utils";

export type SpecsTableSection = {
  title: string;
  data: {
    label: string;
    value: ReactNode | undefined;
    tooltip?: string;
    fullWidth?: boolean;
  }[];
};
export default function SpecsTable({
  sections,
  item,
}: {
  sections: SpecsTableSection[];
  item: GearItem;
}) {
  return (
    <div className="border-border/50 dark:border-border/25 overflow-hidden rounded-md border">
      <div className="">
        {sections.map((section) => (
          <div key={section.title} className="text-sm">
            <div className="divide-border divide-y">
              <h3 className="border-border/50 dark:bg-foreground/10 border-t bg-white px-4 py-2">
                {section.title}
              </h3>
              {section.data
                .filter((row) => row.value !== undefined)
                .map((row, index) => {
                  const baseClass = cn(
                    "hover:bg-zinc-200/70 dark:hover:bg-accent/50 px-4 py-2 border-border/50",
                    {
                      "bg-background": index % 2 === 0,
                      "bg-accent/20": index % 2 !== 0,
                      "pb-4": index === section.data.length - 1,
                    },
                  );
                  if (row.fullWidth) {
                    return (
                      <div
                        key={`${section.title}-full-${index}`}
                        className={baseClass}
                      >
                        {row.value}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={row.label}
                      className={`flex h-full items-start gap-6 ${baseClass}`}
                    >
                      <div className="flex min-w-[180px] shrink-0 items-center gap-2 whitespace-nowrap text-muted-foreground">
                        <span>{row.label}</span>
                        {row.tooltip && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="text-muted-foreground h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent>{row.tooltip}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="flex flex-1 justify-end text-right">
                        {row.value}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <SpecsMissingNote item={item} />
    </div>
  );
}
