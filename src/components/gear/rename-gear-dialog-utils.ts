import type { GearRegion } from "~/lib/gear/region";
import type { GearAlias } from "~/types/gear";

export type AliasMap = Partial<Record<GearRegion, string>>;

export const ALIAS_REGIONS: GearRegion[] = ["US", "EU", "JP"];

export function buildRegionalAliasUpdates(aliases: AliasMap) {
  return ALIAS_REGIONS.map((region) => {
    const name = (aliases[region] ?? "").trim();
    return { region, name: name || null };
  });
}

export function buildInitialAliasMap(
  regionalAliases: readonly GearAlias[] | undefined,
): AliasMap {
  const map: AliasMap = {};
  for (const entry of regionalAliases ?? []) {
    if (ALIAS_REGIONS.includes(entry.region)) {
      map[entry.region] = entry.name ?? "";
    }
  }
  return map;
}

export function getRenameGearDialogOpenState(params: {
  currentName: string;
  defaultNavigateAfterRename: boolean;
  regionalAliases: readonly GearAlias[] | undefined;
}) {
  return {
    newName: params.currentName,
    navigateAfterRename: params.defaultNavigateAfterRename,
    aliases: buildInitialAliasMap(params.regionalAliases),
  };
}
