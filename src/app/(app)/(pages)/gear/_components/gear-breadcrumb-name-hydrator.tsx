"use client";

import { useEffect, useMemo } from "react";
import { GetGearDisplayName } from "~/lib/gear/naming";
import { useCountry } from "~/lib/hooks/useCountry";
import type { GearAlias } from "~/types/gear";

type GearBreadcrumbNameHydratorProps = {
  slug: string;
  name: string;
  regionalAliases?: GearAlias[] | null;
};

function escapeForSelector(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/(["\\])/g, "\\$1");
}

export function GearBreadcrumbNameHydrator({
  slug,
  name,
  regionalAliases,
}: GearBreadcrumbNameHydratorProps) {
  const { region } = useCountry();
  const normalizedAliases = useMemo(
    () => regionalAliases ?? [],
    [regionalAliases],
  );
  const displayName = useMemo(
    () =>
      GetGearDisplayName(
        { name, regionalAliases: normalizedAliases },
        { region },
      ),
    [name, normalizedAliases, region],
  );

  useEffect(() => {
    const escapedSlug = escapeForSelector(slug);
    const target = document.querySelector<HTMLElement>(
      `[data-gear-breadcrumb-slug="${escapedSlug}"]`,
    );
    if (!target) return;
    if (target.textContent === displayName) return;
    target.textContent = displayName;
  }, [displayName, slug]);

  return null;
}
