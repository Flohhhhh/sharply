"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { WishlistRemoveButton } from "./wishlist-remove-button";
import type { GearItem } from "~/types/gear";
import { getBrandNameById } from "~/lib/mapping/brand-map";
import { getItemDisplayPrice } from "~/lib/mapping";

interface WishlistGearCardProps {
  item: GearItem;
  showRemoveButton: boolean;
}

// Client-side wishlist card so we can optimistically hide on removal
export function WishlistGearCard({
  item,
  showRemoveButton,
}: WishlistGearCardProps) {
  const [isRemoved, setIsRemoved] = useState(false);

  if (isRemoved) {
    return null;
  }

  const brandName = getBrandNameById(item.brandId);
  const displayName = getDisplayName(item, brandName);
  const priceDisplay = getItemDisplayPrice(item, {
    style: "short",
    padWholeAmounts: true,
  });
  const brandLabel = brandName || "Unknown brand";

  return (
    <Link
      href={`/gear/${item.slug}`}
      className="group border-border/80 hover:border-foreground/50 relative block overflow-hidden rounded-xl border transition-colors"
    >
      {showRemoveButton ? (
        <div className="absolute top-2 right-2 z-10">
          <WishlistRemoveButton
            slug={item.slug}
            gearName={displayName}
            onRemoved={() => setIsRemoved(true)}
            onUndo={() => setIsRemoved(false)}
          />
        </div>
      ) : null}
      <div className="flex gap-3 p-2">
        {item.thumbnailUrl ? (
          <div className="bg-muted relative aspect-4/3 w-28 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={item.thumbnailUrl}
              alt={displayName}
              fill
              sizes="(min-width: 1024px) 180px, 30vw"
              className="object-contain p-2"
            />
          </div>
        ) : (
          <div className="bg-muted text-muted-foreground relative aspect-4/3 w-28 shrink-0 overflow-hidden rounded-lg">
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-medium">
              {displayName}
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex h-full flex-col gap-1">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {brandLabel}
            </span>
            <h3 className="line-clamp-2 pr-4 text-sm leading-tight font-semibold sm:text-lg">
              {displayName}
            </h3>
            <span className="text-muted-foreground mt-auto text-sm font-medium">
              {priceDisplay}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getDisplayName(item: GearItem, brandName?: string | null) {
  const trimmed = stripBrandFromName(item.name, brandName);
  return trimmed || item.name;
}

function stripBrandFromName(name: string, brandName?: string | null) {
  const normalizedName = name?.trim();
  if (!normalizedName) return normalizedName;

  if (!brandName) return normalizedName;

  const normalizedBrand = brandName.trim();
  if (!normalizedBrand) return normalizedName;

  const pattern = new RegExp(
    `^${escapeRegExp(normalizedBrand)}(?:\\s+|[-–—:]\\s*)`,
    "i",
  );

  const stripped = normalizedName.replace(pattern, "").trim();
  return stripped || normalizedName;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
