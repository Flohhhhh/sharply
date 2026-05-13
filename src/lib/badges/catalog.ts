import {
  Briefcase,
  Calendar,
  Heart,
  PencilRuler,
  Star,
  Telescope,
} from "lucide-react";
import type { BadgeDefinition } from "~/types/badges";
import type { AllowedTrigger } from "./constants";
import { ALLOWED_TRIGGERS } from "./constants";
import { createThresholdBadgeLadder, createTimeBadgeLadder } from "./generator";

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

export const BADGE_CATALOG: BadgeDefinition[] = [
  // Temporary time-limited badge for early members
  {
    key: "pioneer",
    family: "misc",
    label: "Pioneer",
    description:
      "Early Sharply member, granted to all members who joined within the first 30 days of launch",
    color: "#181818",
    iconPresentation: "stroke",
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
    color: "#B581E6",
    iconComponent: Briefcase,
    iconPresentation: "stroke",
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
    color: "rgb(223 173 72)",
    iconComponent: PencilRuler,
    iconPresentation: "stroke",
    trigger: "edit.approved",
    levels: [1, 5, 10, 25, 50, 100, 200, 500, 750, 1000],
    metric: "approvedEdits",
    labelBase: "Spec Scribe",
    descriptionFor: (n: number) =>
      n === 1 ? "First approved spec edit" : `${n} approved spec edits`,
  }),
  // Time-based: Anniversary ladder (join date)
  ...createTimeBadgeLadder({
    baseKey: "anniversary",
    family: "anniversary",
    color: "#10B981",
    iconComponent: Calendar,
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
    color: "#F06583",
    iconComponent: Heart,
    trigger: "wishlist.added",
    levels: [1, 5, 10, 20, 50],
    metric: "wishlistCount",
    labelBase: "GAS Station Attendant",
    descriptionFor: (n: number) =>
      n === 1
        ? "Add the first item to your wishlist"
        : `Have ${n} items on your wishlist at once`,
  }),
];

export function buildTriggerIndex(catalog: BadgeDefinition[]) {
  const index = new Map<AllowedTrigger, BadgeDefinition[]>();
  for (const def of catalog) {
    for (const t of def.triggers) {
      const list = index.get(t as AllowedTrigger) ?? [];
      list.push(def);
      index.set(t as AllowedTrigger, list);
    }
  }
  return index;
}
