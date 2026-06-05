export function resolveRuntimeLocale(locale: string): string {
  if (locale === "zh") {
    return "zh-CN";
  }

  return locale;
}
