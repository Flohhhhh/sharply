"use client";

import { useMemo } from "react";
import { GetGearDisplayName } from "~/lib/gear/naming";
import { useCountry } from "~/lib/hooks/useCountry";
import type { GearAlias } from "~/types/gear";

type GearNameSource = {
  name: string;
  regionalAliases?: GearAlias[] | null;
};

export function useGearDisplayName(item: GearNameSource): string {
  const { region } = useCountry();
  return useMemo(() => GetGearDisplayName(item, { region }), [item, region]);
}
