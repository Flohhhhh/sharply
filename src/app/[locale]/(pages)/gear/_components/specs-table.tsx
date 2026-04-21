import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import type { GearItem } from "~/types/gear";
import { SpecsMissingNote } from "./specs-missing-note";

export type SpecsTableSection = {
  title: string;
  data: {
    label: string;
    value: ReactNode | undefined;
    searchTerms?: string[];
    tooltip?: string;
    fullWidth?: boolean;
    condenseOnMobile?: boolean;
  }[];
};
export default function SpecsTable({
  sections,
  item,
  emptyMessage,
}: {
  sections: SpecsTableSection[];
  item: GearItem;
  emptyMessage?: string;
}) {
  const t = useTranslations("gearDetail");
  const hasVisibleRows = sections.some((section) =>
    section.data.some((row) => row.value !== undefined),
  );

  return (
    <div className="border-border/50 dark:border-border/25 overflow-hidden rounded-md border">
      <div>
        {hasVisibleRows ? (
          sections.map((section) => (
            <div key={section.title} className="text-sm">
              <div className="divide-border divide-y">
                <h3 className="border-border/50 dark:bg-foreground/10 border-t bg-white px-4 py-2">
                  {section.title}
                </h3>
                {section.data
                  .filter((row) => row.value !== undefined)
                  .map((row, index) => {
                    const rowKey =
                      row.label ||
                      row.tooltip ||
                      `${section.title}-full-width-row`;
                    const baseClass = cn(
                      "hover:bg-zinc-200/70 dark:hover:bg-accent/50 border-border/50 px-4 py-2",
                      {
                        "bg-background": index % 2 === 0,
                        "bg-accent/20": index % 2 !== 0,
                        "pb-4": index === section.data.length - 1,
                      },
                    );
                    if (row.fullWidth) {
                      return (
                        <div key={rowKey} className={baseClass}>
                          {row.value}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={rowKey}
                        className={cn(
                          "flex h-full items-start gap-6",
                          row.condenseOnMobile
                            ? "flex-col sm:flex-row"
                            : "flex-row",
                          baseClass,
                        )}
                      >
                        <div className="text-muted-foreground flex min-w-[100px] shrink-0 items-center gap-2 whitespace-nowrap sm:min-w-[180px]">
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
                        <div className="flex flex-1 justify-end self-end text-right">
                          {row.value}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-muted-foreground px-4 py-6 text-sm">
            {emptyMessage ?? t("noSpecificationsAvailable")}
          </div>
        )}
      </div>
      <SpecsMissingNote item={item} />
    </div>
  );
}
