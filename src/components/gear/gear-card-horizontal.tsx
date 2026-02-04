"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "~/lib/utils";
import { formatGearDate, type GearCardProps } from "./gear-card";
import { TrendingBadge } from "../gear-badges/trending-badge";
import { NewBadge } from "../gear-badges/new-badge";
import { BRANDS } from "~/lib/constants";
import { PRICE_FALLBACK_TEXT } from "~/lib/mapping";
import { HallOfFameBadge } from "../gear-badges/hall-of-fame-badge";
import { isInHallOfFame } from "~/lib/utils/is-in-hall-of-fame";
import { isNewRelease } from "~/lib/utils/is-new";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  GearSearchCombobox,
  type GearOption,
} from "~/components/gear/gear-search-combobox";
import { Heart, MoreVertical, Scale } from "lucide-react";
import { actionToggleWishlist } from "~/server/gear/actions";
import { useSession } from "~/lib/auth/auth-client";
import { useState } from "react";
import { toast } from "sonner";
import { buildCompareHref } from "~/lib/utils/url";
import { actionRecordCompareAdd } from "~/server/popularity/actions";

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

const BASE_BRAND_NAMES = uniqueCaseInsensitive(
  BRANDS.flatMap((brand) => splitBrandNameVariants(brand.name)),
).sort((a, b) => b.length - a.length);

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

export type GearCardHorizontalProps = GearCardProps;

export function GearCardHorizontal(props: GearCardHorizontalProps) {
  const {
    href,
    slug,
    name,
    brandName,
    thumbnailUrl,
    gearType,
    releaseDate,
    isTrending,
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
  const [compareSelection, setCompareSelection] = useState<GearOption | null>(
    null,
  );

  const trimmedName = stripBrandFromName(name, brandName);
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
          res.action === "added" ? "Added to wishlist" : "Removed from wishlist",
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

  return (
    <div className={cn("group relative", className)}>
      <Link
        href={href}
        className={cn(
          "border-input bg-card/50 hover:border-foreground/40 block rounded-2xl border transition-all",
          "shadow-sm hover:shadow-md",
        )}
      >
        <div className="bg-background rounded-2xl p-2">
          <div className="flex gap-3">
            {/* Image / left side */}
            <div className="bg-muted dark:bg-card relative w-48 shrink-0 overflow-hidden rounded-xl">
              <div className="relative aspect-video">
                <div className="h-full w-full p-4">
                  <div className="relative h-full w-full">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 192px, 192px"
                        className="pointer-events-none object-contain"
                      />
                    ) : (
                      <div className="text-muted-foreground/50 flex h-full w-full items-center justify-center text-center text-sm font-bold">
                        {trimmedName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right content */}
            <div className="flex min-w-0 flex-1 flex-col justify-between px-1.5 py-2">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-muted-foreground flex min-w-0 flex-1 items-center gap-2 text-sm">
                    {brandName ? <span className="shrink-0">{brandName}</span> : null}
                    {badgeNodes.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {badgeNodes}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {metaRight ? (
                      <span className="bg-secondary rounded-full px-2 py-1 text-xs">
                        {metaRight}
                      </span>
                    ) : null}
                    {session ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <MoreVertical className="size-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </div>

                <div className="text-foreground mt-2 line-clamp-2 text-lg font-semibold">
                  {trimmedName}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="text-muted-foreground text-xs">{dateLabel}</div>
                {priceText && dateLabel !== "---" ? (
                  <>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        priceText === PRICE_FALLBACK_TEXT
                          ? "text-muted-foreground"
                          : "text-foreground",
                      )}
                    >
                      {priceText}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Compare Dialog - rendered outside the Link to work properly */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compare {name}</DialogTitle>
            <DialogDescription>
              Select another item to compare with {name}
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
    </div>
  );
}
