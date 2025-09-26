import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { InfoIcon } from "lucide-react";
import { SpecsMissingNote } from "./specs-missing-note";
import type { GearItem } from "~/types/gear";

export type SpecsTableSection = {
  title: string;
  data: {
    label: string;
    value: ReactNode | undefined;
    tooltip?: string;
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
    <div className="border-border overflow-hidden rounded-md border">
      <div className="">
        {sections.map((section) => (
          <div key={section.title} className="text-sm">
            <div className="divide-border divide-y">
              <h3 className="border-border dark:bg-foreground/10 border-t bg-white px-4 py-2">
                {section.title}
              </h3>
              {section.data
                .filter((item) => item.value !== undefined)
                .map((item, index) => (
                  <div
                    key={item.label}
                    className={`hover:bg-secondary/50 flex h-full items-center justify-between px-4 py-2 transition-colors duration-200 ${
                      index % 2 === 0 ? "bg-background" : "bg-accent/60"
                    }`}
                  >
                    <div className="space-x-3">
                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                      {item.tooltip && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="text-muted-foreground h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>{item.tooltip}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="text-right">{item.value}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <SpecsMissingNote item={item} />
    </div>
  );
}
