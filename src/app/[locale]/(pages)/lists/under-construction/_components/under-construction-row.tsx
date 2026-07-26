"use client";

import { ImageIcon, ImageOff, Pencil } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { TableCell, TableRow } from "~/components/ui/table";
import { cn } from "~/lib/utils";
import type { GearType } from "~/types/gear";
import { shouldRevealRowActions } from "./under-construction-row-actions";
import { splitBrandPrefix } from "./under-construction-row-display";

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
  const { brandPrefix, modelName } = splitBrandPrefix(
    item.name,
    item.brandName,
  );

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
      <TableCell className="w-[420px] max-w-[420px]">
        <div className="flex items-center gap-2">
          <Link
            href={`/gear/${item.slug}`}
            className="group/name focus-visible:ring-ring block min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <span className="block truncate font-medium underline-offset-2 group-hover/name:underline">
              {brandPrefix ? (
                <span className="text-muted-foreground/85 font-normal">
                  {brandPrefix}
                </span>
              ) : null}
              {brandPrefix && modelName ? " " : null}
              {modelName}
            </span>
          </Link>
        </div>
      </TableCell>
      <TableCell className="w-24">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums">
          {item.imageCount === 0 ? (
            <ImageOff className="size-4 text-orange-500" aria-hidden="true" />
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
      <TableCell className="w-[200px]">
        <div className="flex items-center gap-2">
          <Progress value={item.completionPercent} className="h-2" />
          <span className="text-muted-foreground w-10 text-right text-xs">
            {item.completionPercent}%
          </span>
        </div>
      </TableCell>
      <TableCell className="relative min-w-[176px] text-right">
        <div className="flex justify-end">
          {item.underConstruction ? (
            <Badge
              variant="outline"
              className="border-amber-500/25 bg-amber-500/10 font-normal text-amber-700 dark:text-amber-300"
            >
              {t("statusUnderConstruction")}
            </Badge>
          ) : (
            <Badge variant="secondary">{t("statusLowCompleteness")}</Badge>
          )}
        </div>
        <div
          className={cn(
            "via-background/80 to-background/95 pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center justify-end gap-1.5 bg-gradient-to-r from-transparent pr-2 pl-12 opacity-0 transition-opacity duration-150",
            canManageImages ? "w-[48rem]" : "w-[36rem]",
            "group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100",
            isRevealed && "pointer-events-auto opacity-100",
          )}
        >
          <Button
            size="sm"
            variant="default"
            className="cursor-pointer"
            icon={<Pencil />}
            onClick={() =>
              onEdit(item.id, item.slug, item.gearType as GearType)
            }
          >
            {t("editSpecs")}
          </Button>
          {canManageImages ? (
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              icon={<ImageIcon />}
              loading={isLoadingImages}
              onClick={() =>
                onManageImages(item.id, item.slug, item.gearType as GearType)
              }
            >
              {imageT("manageButton")}
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
