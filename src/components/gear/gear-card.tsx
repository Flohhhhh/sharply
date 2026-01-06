"use client";

import Link from "next/link";
import { cn } from "~/lib/utils";
import { AddToCompareButton } from "~/components/compare/add-to-compare-button";
import Image from "next/image";
import { BRANDS } from "~/lib/constants";
import { PRICE_FALLBACK_TEXT } from "~/lib/mapping";
import { Spinner } from "../ui/spinner";
import { TrendingBadge } from "../gear-badges/trending-badge";

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
  brandName?: string | null;
  thumbnailUrl?: string | null;
  gearType?: string | null;
  isTrending?: boolean;
  releaseDate?: string | Date | null;
  releaseDatePrecision?: DatePrecision | null;
  priceText?: string | null;
  metaRight?: React.ReactNode;
  badges?: React.ReactNode;
  className?: string;
};

type DatePrecision = "DAY" | "MONTH" | "YEAR";

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
    brandName,
    thumbnailUrl,
    gearType,
    isTrending,
    releaseDate,
    releaseDatePrecision,
    priceText,
    metaRight,
    badges,
    className,
  } = props;

  const trimmedName = stripBrandFromName(name, brandName);
  const dateLabel = formatGearDate(releaseDate, releaseDatePrecision);
  const badgeNodes: React.ReactNode[] = [];
  if (isTrending) badgeNodes.push(<TrendingBadge key="trending" />);
  if (badges) badgeNodes.push(badges);

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
          <div className="bg-muted dark:bg-card relative aspect-video overflow-hidden rounded-xl p-4">
            {badgeNodes.length ? (
              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                {badgeNodes}
              </div>
            ) : null}
            {thumbnailUrl ? (
              // Transparent gear on gray background expected
              <Image
                src={thumbnailUrl}
                alt={name}
                width={560}
                height={320}
                className="h-full w-full object-contain p-4 transition-opacity group-hover:opacity-50"
              />
            ) : (
              <div className="text-muted-foreground/50 flex h-full w-full items-center justify-center text-xl font-bold">
                {trimmedName}
              </div>
            )}

            {/* Hover actions overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="pointer-events-auto w-full">
                <AddToCompareButton
                  slug={slug}
                  name={name}
                  gearType={gearType ?? undefined}
                  size="sm"
                  className="w-full cursor-pointer"
                  showLabel
                />
              </div>
            </div>
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
          <div className="bg-muted dark:bg-card relative flex aspect-video items-center justify-center overflow-hidden rounded-xl p-4">
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
