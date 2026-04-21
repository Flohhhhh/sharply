"use client";

import { TrophyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "../ui/badge";

export function HallOfFameBadge() {
  const t = useTranslations("hallOfFamePage");
  return (
    <Badge
      variant="secondary"
      className="gap-1 bg-indigo-300 dark:bg-indigo-500"
    >
      <TrophyIcon />
      {t("badgeLabel")}
    </Badge>
  );
}
