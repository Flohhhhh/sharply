"use client";

import { useGearDisplayName } from "~/lib/hooks/useGearDisplayName";
import type { GearAlias } from "~/types/gear";

export function GearDisplayName({
  name,
  regionalAliases,
}: {
  name: string;
  regionalAliases?: GearAlias[] | null;
}) {
  const displayName = useGearDisplayName({ name, regionalAliases });
  return <>{displayName}</>;
}
