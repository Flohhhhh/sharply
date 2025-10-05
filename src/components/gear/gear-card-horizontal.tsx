"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "~/lib/utils";
import { AddToCompareButton } from "~/components/compare/add-to-compare-button";
import type { GearCardProps } from "./gear-card";
import { BRANDS } from "~/lib/constants";

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
    dateText,
    topLeftLabel,
    metaRight,
    badges,
    className,
  } = props;

  const trimmedName = stripBrandFromName(name, brandName);

  return (
    <div className={cn("group relative", className)}>
      <Link
        href={href}
        className={cn(
          "border-input bg-card/50 hover:border-foreground/40 block rounded-lg border transition-all",
          "shadow-sm hover:shadow-md",
        )}
      >
        <div className="bg-background rounded-lg p-2">
          <div className="flex gap-3">
            {/* Image / left side */}
            <div className="bg-muted relative w-44 flex-shrink-0 overflow-hidden rounded">
              <div className="relative aspect-[16/10]">
                {topLeftLabel ? (
                  <div className="absolute top-2 left-2 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    {topLeftLabel}
                  </div>
                ) : null}

                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt={name}
                    fill
                    sizes="(max-width: 768px) 176px, 176px"
                    className="h-full w-full object-contain transition-opacity group-hover:opacity-50"
                    unoptimized
                  />
                ) : (
                  <div className="text-muted-foreground/50 flex h-full w-full items-center justify-center px-2 text-center text-sm font-bold">
                    {trimmedName}
                  </div>
                )}

                {/* Hover actions overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-2 opacity-0 transition-opacity group-hover:opacity-100">
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
            </div>

            {/* Right content */}
            <div className="flex min-w-0 flex-1 flex-col justify-between px-1.5 py-1">
              <div className="flex items-start justify-between gap-2">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  {brandName ? <span>{brandName}</span> : null}
                </div>
                {metaRight ? (
                  <span className="bg-secondary rounded-full px-2 py-1 text-xs">
                    {metaRight}
                  </span>
                ) : null}
              </div>

              <div className="text-foreground mt-1 line-clamp-2 text-base font-semibold">
                {trimmedName}
              </div>

              {badges}

              {dateText ? (
                <div className="text-muted-foreground mt-2 text-xs">
                  {dateText}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
