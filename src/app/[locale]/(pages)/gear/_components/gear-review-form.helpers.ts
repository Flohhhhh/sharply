import { type useTranslations } from "next-intl";

export type GearDetailReviewTranslator = ReturnType<
  typeof useTranslations<"gearDetail">
>;

export function formatRetryDuration(
  retryAfterMs: number,
  t: GearDetailReviewTranslator,
) {
  const totalSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  if (totalSeconds < 60) {
    return t("reviewRetrySeconds", { count: totalSeconds });
  }

  const totalMinutes = Math.ceil(totalSeconds / 60);
  return t("reviewRetryMinutes", { count: totalMinutes });
}
