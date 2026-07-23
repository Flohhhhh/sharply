"use client";

import { Grid2X2, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export type GearResultsView = "grid" | "list";

export const GEAR_RESULTS_VIEW_STORAGE_KEY = "sharply:gear-results-view";

export function useGearResultsView() {
  const [view, setView] = useState<GearResultsView>("grid");

  useEffect(() => {
    const saved = window.localStorage.getItem(GEAR_RESULTS_VIEW_STORAGE_KEY);
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  const updateView = (nextView: string) => {
    if (nextView !== "grid" && nextView !== "list") return;
    setView(nextView);
    window.localStorage.setItem(GEAR_RESULTS_VIEW_STORAGE_KEY, nextView);
  };

  return { view, setView: updateView };
}

export function GearViewToggle({
  view,
  onViewChange,
}: {
  view: GearResultsView;
  onViewChange: (view: string) => void;
}) {
  const t = useTranslations("gearTable");
  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={onViewChange}
      variant="outline"
      size="sm"
      aria-label={t("viewMode")}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="grid"
            aria-label={t("gridView")}
            className="px-3"
          >
            <Grid2X2 className="size-4" aria-hidden />
            <span>{t("gridView")}</span>
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>{t("gridView")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="list"
            aria-label={t("listView")}
            className="px-3"
          >
            <List className="size-4" aria-hidden />
            <span>{t("listView")}</span>
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>{t("listView")}</TooltipContent>
      </Tooltip>
    </ToggleGroup>
  );
}
