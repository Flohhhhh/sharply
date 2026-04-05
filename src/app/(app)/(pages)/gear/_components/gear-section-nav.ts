export interface StaffVerdictNavigationData {
  content?: string | null;
  pros?: unknown;
  cons?: unknown;
  whoFor?: string | null;
  notFor?: string | null;
  alternatives?: unknown;
}

export interface GearSectionNavItem {
  href: string;
  label: string;
}

interface BuildGearSectionNavItemsInput {
  hasEditorialReview: boolean;
  hasCreatorVideos: boolean;
  hasRawSamples: boolean;
  hasAlternatives: boolean;
  hasRelatedArticles: boolean;
  verdict: StaffVerdictNavigationData | null;
}

function hasNonEmptyString(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function hasNonEmptyStringArray(value: unknown) {
  return (
    Array.isArray(value) &&
    value.some((item) => typeof item === "string" && hasNonEmptyString(item))
  );
}

export function hasStaffVerdictContent(
  verdict: StaffVerdictNavigationData | null,
) {
  if (!verdict) {
    return false;
  }

  return (
    hasNonEmptyString(verdict.content) ||
    hasNonEmptyStringArray(verdict.pros) ||
    hasNonEmptyStringArray(verdict.cons) ||
    hasNonEmptyString(verdict.whoFor) ||
    hasNonEmptyString(verdict.notFor) ||
    hasNonEmptyStringArray(verdict.alternatives)
  );
}

export function buildGearSectionNavItems({
  hasEditorialReview,
  hasCreatorVideos,
  hasRawSamples,
  hasAlternatives,
  hasRelatedArticles,
  verdict,
}: BuildGearSectionNavItemsInput): GearSectionNavItem[] {
  const items: GearSectionNavItem[] = [];

  if (hasStaffVerdictContent(verdict)) {
    items.push({ href: "#staff-verdict", label: "Staff Verdict" });
  }

  items.push({ href: "#specs", label: "Specs" });

  if (hasEditorialReview) {
    items.push({ href: "#editorial-review", label: "Review" });
  }

  items.push({ href: "#reviews", label: "Reviews" });

  if (hasRawSamples) {
    items.push({ href: "#raw-samples", label: "Raw Samples" });
  }

  if (hasAlternatives) {
    items.push({ href: "#alternatives", label: "Alternatives" });
  }

  if (hasCreatorVideos) {
    items.push({ href: "#creator-videos", label: "Creator Videos" });
  }

  if (hasRelatedArticles) {
    items.push({ href: "#related-articles", label: "Articles" });
  }

  return items;
}
