import type { BadgeDefinition, UserSnapshot } from "~/types/badges";
import { toRomanNumeral } from "~/lib/utils";

export function createThresholdBadgeLadder(params: {
  baseKey: string;
  family: string;
  icon: string;
  color?: string;
  iconComponent?: BadgeDefinition["iconComponent"];
  trigger: string;
  levels: number[];
  metric: keyof UserSnapshot;
  labelBase?: string; // If provided, label becomes `${labelBase} ${roman(levelIndex)}`
  labelFor?: (level: number) => string; // Back-compat fallback
  descriptionFor?: (level: number) => string;
  sortFor?: (level: number) => number;
}): BadgeDefinition[] {
  const {
    baseKey,
    family,
    icon,
    color,
    iconComponent,
    trigger,
    levels,
    metric,
    labelBase,
    labelFor,
    descriptionFor,
  } = params;
  const sortFor = params.sortFor ?? ((lvl) => lvl);
  return levels.map((lvl, idx) => {
    const levelIndex = idx + 1;
    const computedLabel = labelBase
      ? `${labelBase} ${toRomanNumeral(levelIndex)}`
      : labelFor
        ? labelFor(lvl)
        : `${baseKey} ${toRomanNumeral(levelIndex)}`;
    const sortScore = params.sortFor ? sortFor(lvl) : levelIndex;
    return {
      key: `${baseKey}_${lvl}`,
      family,
      label: computedLabel,
      description: descriptionFor ? descriptionFor(lvl) : undefined,
      icon,
      color,
      iconComponent,
      level: lvl,
      levelIndex,
      sortScore,
      triggers: [trigger],
      test: (snapshot) => (snapshot[metric] as number) >= lvl,
    } as BadgeDefinition;
  });
}

/**
 * Time-based ladder generator (e.g., anniversaries)
 * - durationsDays: list of day thresholds (e.g., 7, 30, 182, 365,...)
 * - test computes daysSinceJoin = floor((now - snapshot.joinDate)/86400000)
 * - now can be overridden via context.now; defaults to Date.now()
 */
export function createTimeBadgeLadder(params: {
  baseKey: string;
  family: string;
  icon: string;
  color?: string;
  iconComponent?: BadgeDefinition["iconComponent"];
  trigger: string;
  durationsDays: number[];
  labelBase?: string;
  descriptionFor?: (days: number) => string;
  sortFor?: (days: number) => number;
}): BadgeDefinition[] {
  const {
    baseKey,
    family,
    icon,
    color,
    iconComponent,
    trigger,
    durationsDays,
    labelBase,
    descriptionFor,
  } = params;

  return durationsDays.map((days, idx) => {
    const levelIndex = idx + 1;
    const computedLabel = labelBase
      ? `${labelBase} ${toRomanNumeral(levelIndex)}`
      : `${baseKey} ${toRomanNumeral(levelIndex)}`;
    const sortScore = params.sortFor ? params.sortFor(days) : levelIndex;

    const test: BadgeDefinition["test"] = (snapshot, context) => {
      const join = (snapshot as any).joinDate as Date | null | undefined;
      if (!join) return false;
      const nowMs = (context as any)?.now ?? Date.now();
      const joinMs = new Date(join).getTime();
      if (!Number.isFinite(joinMs)) return false;
      const diffDays = Math.floor((nowMs - joinMs) / 86400000);
      return diffDays >= days;
    };

    return {
      key: `${baseKey}_${days}`,
      family,
      label: computedLabel,
      description: descriptionFor ? descriptionFor(days) : undefined,
      icon,
      color,
      iconComponent,
      level: days,
      levelIndex,
      sortScore,
      triggers: [trigger],
      test,
    } as BadgeDefinition;
  });
}
