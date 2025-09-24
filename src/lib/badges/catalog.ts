import type { BadgeDefinition } from "~/types/badges";
import { Star, Heart, Telescope } from "lucide-react";
import { createThresholdBadgeLadder, createTimeBadgeLadder } from "./generator";
import { ALLOWED_TRIGGERS } from "./constants";

export function validateBadgeCatalog(catalog: BadgeDefinition[]) {
  const keys = new Set<string>();
  const allowed = new Set<string>(ALLOWED_TRIGGERS as unknown as string[]);
  for (const def of catalog) {
    if (keys.has(def.key)) throw new Error(`Duplicate badge key: ${def.key}`);
    keys.add(def.key);
    if (!def.triggers?.length)
      throw new Error(`Badge ${def.key} missing triggers`);
    for (const t of def.triggers) {
      if (!allowed.has(t))
        throw new Error(`Badge ${def.key} invalid trigger: ${t}`);
    }
    if (typeof def.test !== "function")
      throw new Error(`Badge ${def.key} missing test function`);
  }
}
import type { AllowedTrigger } from "./constants";

export const BADGE_CATALOG: BadgeDefinition[] = [
  // Temporary time-limited badge for early members
  {
    key: "pioneer",
    family: "misc",
    label: "Pioneer",
    description:
      "Early Sharply member, granted to all members who joined within the first 30 days of launch",
    icon: "telescope",
    color: "#181818",
    iconComponent: Telescope,
    sortScore: 1,
    // Grant on login/signup and other common events for now. We'll remove later.
    triggers: [
      "review.approved",
      "edit.approved",
      "ownership.added",
      "wishlist.added",
      "compare.used",
      "cron.anniversary",
    ] as unknown as AllowedTrigger[],
    test: () => true,
  },
  ...createThresholdBadgeLadder({
    baseKey: "reviews",
    family: "reviews",
    icon: "star",
    color: "#4F78D2",
    iconComponent: Star,
    trigger: "review.approved",
    levels: [1, 10, 20, 40, 80],
    metric: "approvedReviews",
    labelBase: "Review Master",
    descriptionFor: (lvl: number) =>
      lvl === 1
        ? "Have your first approved review"
        : `Have ${lvl} approved reviews on gear items`,
  }),
  // Ownership ladder
  ...createThresholdBadgeLadder({
    baseKey: "ownership",
    family: "ownership",
    icon: "briefcase",
    color: "#B581E6",
    iconComponent: Star,
    trigger: "ownership.added",
    levels: [1, 5, 10, 20, 50],
    metric: "ownershipCount",
    labelBase: "Gear Collector",
    descriptionFor: (n: number) =>
      n === 1 ? "Add your first owned item" : `Own ${n} items total`,
  }),
  // Edits ladder (approved gear edits)
  ...createThresholdBadgeLadder({
    baseKey: "edits",
    family: "edits",
    icon: "pencil",
    color: "#EDB554",
    iconComponent: Star,
    trigger: "edit.approved",
    levels: [1, 5, 10, 25, 50],
    metric: "approvedEdits",
    labelBase: "Spec Scribe",
    descriptionFor: (n: number) =>
      n === 1 ? "First approved spec edit" : `${n} approved spec edits`,
  }),
  // Time-based: Anniversary ladder (join date)
  ...createTimeBadgeLadder({
    baseKey: "anniversary",
    family: "anniversary",
    icon: "calendar",
    color: "#10B981",
    iconComponent: Star,
    trigger: "cron.anniversary",
    // days thresholds: 1w, 1m, 6m, 1y, 2y..10y
    durationsDays: [
      7,
      30,
      182,
      365,
      365 * 2,
      365 * 3,
      365 * 4,
      365 * 5,
      365 * 7,
      365 * 10,
    ],
    labelBase: "Member Anniversary",
    descriptionFor: (days: number) =>
      days === 7
        ? "Member for 1 week"
        : days === 30
          ? "Member for 1 month"
          : days === 182
            ? "Member for 6 months"
            : days === 365
              ? "Member for 1 year"
              : `Member for ${Math.round(days / 365)} years`,
  }),
  ...createThresholdBadgeLadder({
    baseKey: "wishlist",
    family: "wishlist",
    icon: "heart",
    color: "#F06583",
    iconComponent: Heart,
    trigger: "wishlist.added",
    levels: [1, 5, 10, 20, 50],
    metric: "wishlistCount",
    labelBase: "GAS Station Attendant",
    descriptionFor: (lvl: number) =>
      lvl === 1
        ? "Add the first item to your wishlist"
        : lvl === 5
          ? "Have 5 items on your wishlist at once"
          : lvl === 10
            ? "Have 10 items on your wishlist at once"
            : lvl === 20
              ? "Have 20 items on your wishlist at once"
              : `Have 50 items on your wishlist at once`,
  }),
];

export function buildTriggerIndex(catalog: BadgeDefinition[]) {
  const index = new Map<AllowedTrigger, BadgeDefinition[]>();
  for (const def of catalog) {
    for (const t of def.triggers) {
      const list = (index.get(t as AllowedTrigger) ?? []) as BadgeDefinition[];
      list.push(def);
      index.set(t as AllowedTrigger, list);
    }
  }
  return index;
}
