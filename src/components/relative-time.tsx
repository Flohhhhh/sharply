"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  formatDate,
  formatRelativeDate,
  type DateFormatPreset,
} from "~/lib/format/date";

type RelativeTimeProps = {
  isoDate: string;
  locale: string;
  style?: "short" | "long";
  numeric?: "always" | "auto";
  capitalize?: boolean;
  justNowLabel?: string;
  fallbackPreset?: DateFormatPreset;
  className?: string;
};

const subscribe = () => () => undefined;

export function RelativeTime({
  isoDate,
  locale,
  style = "long",
  numeric = "auto",
  capitalize = false,
  justNowLabel,
  fallbackPreset = "date-medium",
  className,
}: RelativeTimeProps) {
  const absoluteText = useMemo(
    () => formatDate(isoDate, { locale, preset: fallbackPreset }),
    [fallbackPreset, isoDate, locale],
  );
  const hydratedText = useMemo(
    () =>
      typeof window === "undefined"
        ? absoluteText
        : formatRelativeDate(isoDate, {
            locale,
            style,
            numeric,
            capitalize,
            justNowLabel,
            fallback: absoluteText,
          }),
    [absoluteText, capitalize, isoDate, justNowLabel, locale, numeric, style],
  );
  const text = useSyncExternalStore(
    subscribe,
    () => hydratedText,
    () => absoluteText,
  );

  return (
    <time dateTime={isoDate} className={className}>
      {text}
    </time>
  );
}
