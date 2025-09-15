import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@radix-ui/react-tooltip";
import { InfoIcon } from "lucide-react";
import { SpecsMissingNote } from "./specs-missing-note";
import type { GearItem } from "~/types/gear";

export type SpecsTableSection = {
  title: string;
  data: {
    label: string;
    value: string | number | boolean | undefined;
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
              <h3 className="border-border border-t bg-white px-4 py-2">
                {section.title}
              </h3>
              {section.data
                .filter((item) => item.value !== undefined)
                .map((item) => (
                  <div
                    key={item.label}
                    className="hover:bg-accent/50 flex h-full items-center justify-between px-4 py-2 transition-colors duration-200"
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
                    <span className="">{item.value}</span>
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
