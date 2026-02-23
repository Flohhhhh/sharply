"use client";

import type React from "react";
import Link from "next/link";
import { cn } from "~/lib/utils";
import Image from "next/image";
import { BRANDS } from "~/lib/constants";
import { PRICE_FALLBACK_TEXT } from "~/lib/mapping";
import { Spinner } from "../ui/spinner";
import { TrendingBadge } from "../gear-badges/trending-badge";
import { NewBadge } from "../gear-badges/new-badge";
import { isNewRelease } from "~/lib/utils/is-new";
import { HallOfFameBadge } from "../gear-badges/hall-of-fame-badge";
import { isInHallOfFame } from "~/lib/utils/is-in-hall-of-fame";
import { useSession } from "~/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { actionToggleWishlist } from "~/server/gear/actions";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  GearSearchCombobox,
  type GearOption,
} from "~/components/gear/gear-search-combobox";
import {
  Bookmark,
  Heart,
  MoreVertical,
  PackageOpen,
  Scale,
} from "lucide-react";
import { buildCompareHref } from "~/lib/utils/url";
import { actionRecordCompareAdd } from "~/server/popularity/actions";
import { useGearDisplayName } from "~/lib/hooks/useGearDisplayName";
import type { GearAlias } from "~/types/gear";
import { SaveItemButton } from "./save-item-button";
import { actionToggleOwnership } from "~/server/gear/actions";

const BASE_BRAND_NAMES = uniqueCaseInsensitive(
  BRANDS.flatMap((brand) => splitBrandNameVariants(brand.name)),
).sort((a, b) => b.length - a.length);

function splitBrandNameVariants(brandName: string) {
  const normalized = brandName?.trim();
  if (!normalized) return [] as string[];

  const parts = normalized
    .split(/[\\/]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return uniqueCaseInsensitive([normalized, ...parts]);
}

function uniqueCaseInsensitive(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripBrandFromName(name: string, brandName?: string | null) {
  const normalizedName = name.trim();
  if (!normalizedName) return normalizedName;

  const candidateBrands = uniqueCaseInsensitive([
    ...(brandName ? splitBrandNameVariants(brandName) : []),
    ...BASE_BRAND_NAMES,
  ]).sort((a, b) => b.length - a.length);

  for (const candidate of candidateBrands) {
    const pattern = new RegExp(
      `^${escapeRegExp(candidate)}(?:\\s+|[-–—:]\\s*)`,
      "i",
    );

    if (pattern.test(normalizedName)) {
      const stripped = normalizedName.replace(pattern, "").trim();
      if (stripped) {
        return stripped;
      }
    }
  }

  return normalizedName;
}

export type GearCardProps = {
  href: string;
  slug: string;
  name: string;
  regionalAliases?: GearAlias[] | null;
  brandName?: string | null;
  thumbnailUrl?: string | null;
  gearType?: string | null;
  isTrending?: boolean;
  releaseDate?: string | Date | null;
  releaseDatePrecision?: DatePrecision | null;
  announcedDate?: string | Date | null;
  announceDatePrecision?: DatePrecision | null;
  priceText?: string | null;
  metaRight?: React.ReactNode;
  badges?: React.ReactNode;
  className?: string;
};

type DatePrecision = "DAY" | "MONTH" | "YEAR";
type SavePickerState = {
  lists: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    itemCount: number;
  }>;
  savedListIds: string[];
  defaultListId: string | null;
} | null;

export function formatGearDate(
  dateValue?: string | Date | null,
  precision?: DatePrecision | null,
) {
  if (!dateValue) return "---";

  const parsedDate =
    dateValue instanceof Date ? dateValue : new Date(dateValue ?? undefined);
  if (Number.isNaN(parsedDate.getTime())) return "-";

  const resolvedPrecision: DatePrecision = precision ?? "MONTH";
  if (resolvedPrecision === "YEAR") {
    return parsedDate.getFullYear().toString();
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

// TODO: Need to work on what information is showed on these cards, might vary based on where they are used
// should so badges, trending, etc. in some places.
export function GearCard(props: GearCardProps) {
  const {
    href,
    slug,
    name,
    regionalAliases,
    brandName,
    thumbnailUrl,
    gearType,
    isTrending,
    releaseDate,
    releaseDatePrecision,
    announcedDate,
    announceDatePrecision,
    priceText,
    metaRight,
    badges,
    className,
  } = props;

  const { data } = useSession();
  const router = useRouter();
  const session = data?.session;
  const [inWishlist, setInWishlist] = useState<boolean | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveStateLoading, setSaveStateLoading] = useState(false);
  const [saveState, setSaveState] = useState<SavePickerState>(null);
  const [ownershipLoading, setOwnershipLoading] = useState(false);
  const [compareSelection, setCompareSelection] = useState<GearOption | null>(
    null,
  );

  const displayName = useGearDisplayName({ name, regionalAliases });
  const trimmedName = stripBrandFromName(displayName, brandName);
  const dateLabel = formatGearDate(
    releaseDate ?? announcedDate,
    releaseDatePrecision ?? announceDatePrecision,
  );
  const isNew = isNewRelease(releaseDate, releaseDatePrecision);
  const isHallOfFameItem = isInHallOfFame(slug);
  const badgeNodes: React.ReactNode[] = [];
  if (isHallOfFameItem) badgeNodes.push(<HallOfFameBadge key="hall-of-fame" />);
  if (isTrending) badgeNodes.push(<TrendingBadge key="trending" />);
  if (isNew) badgeNodes.push(<NewBadge key="new" />);
  if (badges) badgeNodes.push(badges);

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session || wishlistLoading) return;

    setWishlistLoading(true);
    const action = inWishlist ? "remove" : "add";

    try {
      const res = await actionToggleWishlist(slug, action);
      if (res.ok) {
        setInWishlist(res.action === "added");
        toast.success(
          res.action === "added"
            ? "Added to wishlist"
            : "Removed from wishlist",
        );
      }
    } catch (error) {
      toast.error("Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleOpenCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCompareOpen(true);
  };

  const handleCompareSelect = async (option: GearOption | null) => {
    if (!option) return;
    setCompareOpen(false);
    try {
      await actionRecordCompareAdd({ slug: option.slug });
    } catch {
      // ignore failures
    }
    router.push(buildCompareHref([slug, option.slug]));
  };

  const handleOpenSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaveOpen(true);
    if (saveState || saveStateLoading) return;

    setSaveStateLoading(true);
    try {
      const response = await fetch(
        `/api/user-lists/picker?slug=${encodeURIComponent(slug)}`,
      );
      if (!response.ok) throw new Error("Failed to load list options");
      const payload = (await response.json()) as { state: SavePickerState };
      setSaveState(payload.state);
    } catch {
      toast.error("Failed to load list options");
    } finally {
      setSaveStateLoading(false);
    }
  };

  const handleAddToCollection = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (ownershipLoading) return;

    setOwnershipLoading(true);
    try {
      const result = await actionToggleOwnership(slug, "add");
      if (result.ok) {
        toast.success("Added to collection");
      } else if (result.reason === "already_owned") {
        toast.info("Already in collection");
      } else {
        toast.error("Failed to update collection");
      }
    } catch {
      toast.error("Failed to update collection");
    } finally {
      setOwnershipLoading(false);
    }
  };

  return (
    <div className={cn("group relative", className)}>
      {/* Outer card with hover-thicker border */}
      <Link
        href={href}
        className={cn(
          "border-input bg-card/50 hover:border-foreground/40 block rounded-2xl border transition-all",
          "shadow-sm hover:shadow-md",
        )}
      >
        {/* Inset surface (border removed) */}
        <div className="bg-background rounded-2xl p-2">
          {/* Image area */}
          <div className="bg-muted dark:bg-card relative aspect-video overflow-hidden rounded-xl">
            {badgeNodes.length ? (
              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                {badgeNodes}
              </div>
            ) : null}
            <div className="h-full w-full p-8">
              <div className="relative h-full w-full">
                {thumbnailUrl ? (
                  // Transparent gear on gray background expected
                  <Image
                    src={thumbnailUrl}
                    alt={displayName}
                    fill
                    sizes="(max-width: 640px) 85vw, 560px"
                    className="pointer-events-none object-contain transition-opacity group-hover:opacity-50"
                  />
                ) : (
                  <div className="text-muted-foreground/50 flex h-full w-full items-center justify-center text-xl font-bold">
                    {trimmedName}
                  </div>
                )}
              </div>
            </div>

            {/* Hover actions overlay */}
            {session ? (
              <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="pointer-events-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="shadow-md"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <MoreVertical className="size-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      side="bottom"
                      sideOffset={6}
                    >
                      <DropdownMenuItem
                        onClick={handleAddToWishlist}
                        disabled={wishlistLoading}
                      >
                        <Heart
                          className={cn(
                            "size-4",
                            inWishlist === true && "fill-current",
                          )}
                        />
                        {inWishlist === true
                          ? "Remove from Wishlist"
                          : "Add to Wishlist"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleOpenCompare}>
                        <Scale className="size-4" />
                        Compare
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleOpenSave}>
                        <Bookmark className="size-4" />
                        Save
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleAddToCollection}
                        disabled={ownershipLoading}
                      >
                        <PackageOpen className="size-4" />
                        Add to Collection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : null}
          </div>

          {/* Content below image */}
          <div className="mt-3 space-y-2 px-1.5 pb-1 transition-opacity group-hover:opacity-50">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                {brandName ? <span>{brandName}</span> : null}
              </div>
              {metaRight ? (
                <span className="bg-secondary rounded-full px-2 py-1 text-xs">
                  {metaRight}
                </span>
              ) : null}
            </div>

            <div className="text-foreground truncate text-lg font-semibold">
              {trimmedName}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-xs">{dateLabel}</div>
              {priceText ? (
                <span
                  className={cn(
                    "text-sm font-semibold",
                    priceText === PRICE_FALLBACK_TEXT
                      ? "text-muted-foreground"
                      : "text-foreground",
                  )}
                >
                  {priceText}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Link>

      {/* Compare Dialog - rendered outside the Link to work properly */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compare {displayName}</DialogTitle>
            <DialogDescription>
              Select another item to compare with {displayName}
            </DialogDescription>
          </DialogHeader>
          <GearSearchCombobox
            value={compareSelection}
            setValue={setCompareSelection}
            onSelectionChange={handleCompareSelect}
            filters={gearType ? { gearType } : undefined}
            excludeIds={[slug]}
            placeholder="Search for gear..."
            searchPlaceholder="Search gear to compare"
          />
        </DialogContent>
      </Dialog>
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save {displayName}</DialogTitle>
          </DialogHeader>
          {saveStateLoading ? (
            <div className="text-muted-foreground text-sm">Loading list options…</div>
          ) : (
            <SaveItemButton slug={slug} initialState={saveState} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function GearCardSkeleton() {
  return (
    <div className="group relative">
      <div
        className={cn(
          "border-input bg-card/50 hover:border-foreground/40 block rounded-2xl border transition-all",
          "shadow-sm hover:shadow-md",
        )}
      >
        {/* Inset surface (border removed) */}
        <div className="bg-background rounded-2xl p-2">
          {/* Image area */}
          <div className="bg-muted dark:bg-card relative flex aspect-video items-center justify-center overflow-hidden rounded-xl">
            <Spinner className="text-muted-foreground/50 size-6" />
          </div>
          <div className="mt-3 space-y-5 px-1.5 pb-1 transition-opacity group-hover:opacity-50">
            <div className="bg-muted/60 h-3 w-16 rounded" />
            <div className="bg-muted h-4 w-16 rounded" />
            <div className="flex items-center justify-between">
              <div className="bg-muted/60 h-3 w-24 rounded"></div>
              <div className="bg-muted/60 h-4 w-12 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
