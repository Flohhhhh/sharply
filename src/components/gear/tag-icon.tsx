"use client";

import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { normalizeTagIconName } from "~/lib/tags/normalize-tag-icon-name";

const supportedIconNames = new Set<string>(iconNames);

export function isTagIconName(name: string | null | undefined) {
  const normalizedName = normalizeTagIconName(name);
  return Boolean(normalizedName && supportedIconNames.has(normalizedName));
}

export function TagIcon({
  name,
  className,
  size,
}: {
  name: string | null | undefined;
  className?: string;
  size?: number;
}) {
  const normalizedName = normalizeTagIconName(name);
  if (!normalizedName || !supportedIconNames.has(normalizedName)) return null;

  return (
    <DynamicIcon
      name={normalizedName as IconName}
      className={className}
      size={size}
      aria-hidden="true"
    />
  );
}
