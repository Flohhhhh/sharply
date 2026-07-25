"use client";

import { ImageIcon, ImageOff, Pencil } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { TableCell, TableRow } from "~/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { GEAR_TYPE_LABELS } from "~/lib/constants";
import { cn } from "~/lib/utils";
import type { GearType } from "~/types/gear";
import { shouldRevealRowActions } from "./under-construction-row-actions";

export type UnderConstructionRowData = {
  id: string;
  slug: string;
  name: string;
  brandName: string | null;
  thumbnailUrl: string | null;
  hasImage: boolean;
  imageCount: number;
  imageCapacity: number;
  gearType: string;
  missingCount: number;
  missing: string[];
  completionPercent: number;
  createdAt: string | Date;
  underConstruction: boolean;
  brandId?: string | null;
};

export function UnderConstructionRow({
  canManageImages,
  index,
  isLoadingImages,
  isRevealed,
  item,
  onEdit,
  onManageImages,
  onReveal,
}: {
  canManageImages: boolean;
  index: number;
  isLoadingImages: boolean;
  isRevealed: boolean;
  item: UnderConstructionRowData;
  onEdit: (id: string, slug: string, type: GearType) => void;
  onManageImages: (id: string, slug: string, type: GearType) => void;
  onReveal: (id: string) => void;
}) {
  const t = useTranslations("underConstructionPage");
  const imageT = useTranslations("gearDetail.gearImages");
  const typeLabel =
    GEAR_TYPE_LABELS[item.gearType as keyof typeof GEAR_TYPE_LABELS] ??
    item.gearType;

  return (
    <TableRow
      className={cn(
        "group overflow-visible",
        index % 2 === 0 ? "hover:bg-accent/25" : "hover:bg-accent/60",
        isRevealed && "bg-accent/60",
      )}
      onPointerDown={(event) => {
        if (!(event.target instanceof Element)) return;
        const isInteractiveTarget = Boolean(
          event.target.closest(
            "a, button, input, select, textarea, [role=button]",
          ),
        );
        if (shouldRevealRowActions(event.pointerType, isInteractiveTarget)) {
          onReveal(item.id);
        }
      }}
    >
      <TableCell className="max-w-[360px]">
        <div className="flex items-center gap-2">
          <Link
            href={`/gear/${item.slug}`}
            className="group/name focus-visible:ring-ring block min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <span className="block truncate font-medium underline-offset-2 group-hover/name:underline">
              {item.name}
            </span>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              {item.brandName ? (
                <>
                  <span className="truncate">{item.brandName}</span>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              <span>{typeLabel}</span>
            </span>
          </Link>
        </div>
      </TableCell>
      <TableCell className="w-24">
        <div
          className={cn(
            "text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums",
            item.imageCount === 0 && "text-orange-500",
          )}
        >
          {item.imageCount === 0 ? (
            <ImageOff className="size-4" aria-hidden="true" />
          ) : (
            <ImageIcon className="size-4" aria-hidden="true" />
          )}
          <span>
            {item.imageCount}/{item.imageCapacity}
          </span>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <div className="flex flex-wrap gap-1">
          {item.missing.slice(0, 6).map((missingSpec, missingSpecIndex) => (
            <Badge
              key={`${missingSpec}-${missingSpecIndex}`}
              variant="outline"
              className="text-xs"
            >
              {missingSpec}
            </Badge>
          ))}
          {item.missing.length > 6 ? (
            <Badge variant="outline" className="text-xs">
              {t("moreMissing", { count: item.missing.length - 6 })}
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="w-[240px]">
        <div className="flex items-center gap-2">
          <Progress value={item.completionPercent} className="h-2" />
          <span className="text-muted-foreground w-10 text-right text-xs">
            {item.completionPercent}%
          </span>
        </div>
      </TableCell>
      <TableCell className="relative min-w-[176px] text-right">
        <div
          className={cn(
            "transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0",
            isRevealed && "opacity-0",
          )}
        >
          {item.underConstruction ? (
            <Badge variant="destructive">{t("statusUnderConstruction")}</Badge>
          ) : (
            <Badge variant="secondary">{t("statusLowCompleteness")}</Badge>
          )}
        </div>
        <div
          className={cn(
            "via-background/90 to-background pointer-events-none absolute inset-y-0 right-0 flex items-center justify-end gap-1.5 bg-gradient-to-r from-transparent pr-2 pl-8 opacity-0 transition-opacity duration-150",
            canManageImages ? "w-32" : "w-20",
            "group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100",
            isRevealed && "pointer-events-auto opacity-100",
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="size-8 rounded-full"
                icon={<Pencil />}
                aria-label={t("editSpecs")}
                onClick={() =>
                  onEdit(item.id, item.slug, item.gearType as GearType)
                }
              />
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>{t("editSpecs")}</TooltipContent>
          </Tooltip>
          {canManageImages ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8 rounded-full"
                  icon={<ImageIcon />}
                  loading={isLoadingImages}
                  aria-label={imageT("manageButton")}
                  onClick={() =>
                    onManageImages(
                      item.id,
                      item.slug,
                      item.gearType as GearType,
                    )
                  }
                />
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                {imageT("manageButton")}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
