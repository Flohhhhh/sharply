import type { ComponentType, SVGProps } from "react";
export type UserSnapshot = {
  approvedEdits: number;
  approvedReviews: number;
  wishlistCount: number;
  ownershipCount: number;
  joinDate: Date | null;
};

export type BadgeTest = (snapshot: UserSnapshot, context?: unknown) => boolean;

export type BadgeDefinition = {
  key: string;
  family: string; // use "misc" for one-offs
  label: string;
  description?: string;
  icon: string;
  color?: string; // tailwind color token or hex
  iconComponent?: ComponentType<SVGProps<SVGSVGElement>>;
  level?: number; // present for ladder badges only
  levelIndex?: number; // 1-based ordinal within its ladder
  sortScore: number;
  triggers: string[]; // see ALLOWED_TRIGGERS
  test: BadgeTest;
};

export type BadgeEvent = {
  type: import("~/lib/badges/constants").AllowedTrigger;
  context?: unknown;
};
