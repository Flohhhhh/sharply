"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "~/lib/utils";
import { formatGearDate, type GearCardProps } from "./gear-card";
import { TrendingBadge } from "../gear-badges/trending-badge";
import { NewBadge } from "../gear-badges/new-badge";
import { BRANDS } from "~/lib/constants";
import { PRICE_FALLBACK_TEXT } from "~/lib/mapping";
import { HallOfFameBadge } from "../gear-badges/hall-of-fame-badge";
import { isInHallOfFame } from "~/lib/utils/is-in-hall-of-fame";
import { isNewRelease } from "~/lib/utils/is-new";
import { useSession } from "~/lib/auth/auth-client";
import { useGearDisplayName } from "~/lib/hooks/useGearDisplayName";
import { GearCardMoreMenu } from "./gear-card-more-menu";

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
    regionalAliases,
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
  const session = data?.session;
  const displayName = useGearDisplayName({ name, regionalAliases });
  const trimmedName = stripBrandFromName(displayName, brandName);
  const dateLabel = formatGearDate(
    releaseDate ?? announcedDate,
    releaseDatePrecision ?? announceDatePrecision,
  );
  const isNew = isNewRelease(
    releaseDate ?? announcedDate,
    releaseDatePrecision ?? announceDatePrecision,
  );
  const isHallOfFameItem = isInHallOfFame(slug);
  const badgeNodes: React.ReactNode[] = [];
  if (isHallOfFameItem) badgeNodes.push(<HallOfFameBadge key="hall-of-fame" />);
  if (isTrending) badgeNodes.push(<TrendingBadge key="trending" />);
  if (isNew) badgeNodes.push(<NewBadge key="new" />);
  if (badges) badgeNodes.push(badges);

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
                        alt={displayName}
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
                    {brandName ? (
                      <span className="shrink-0">{brandName}</span>
                    ) : null}
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
                      <GearCardMoreMenu
                        slug={slug}
                        displayName={displayName}
                        gearType={gearType}
                      />
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
    </div>
  );
}
