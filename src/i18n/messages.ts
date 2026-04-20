import type defaultMessages from "../../messages/en.json";
import type { Locale } from "./config";
import { defaultLocale } from "./config";

type Messages = typeof defaultMessages;

const messageLoaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import("../../messages/en.json"),
  ja: () => import("../../messages/ja.json"),
  de: () => import("../../messages/de.json"),
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeMessages(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>,
) {
  const merged: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    const current = merged[key];

    if (isPlainObject(current) && isPlainObject(value)) {
      merged[key] = mergeMessages(current, value);
      continue;
    }

    merged[key] = value;
  }

  return merged;
}

export async function getMessagesForLocale(locale: Locale): Promise<Messages> {
  const baseMessages = (await messageLoaders.en()).default;

  if (locale === defaultLocale) {
    return baseMessages;
  }

  const localeMessages = (await messageLoaders[locale]()).default;

  return mergeMessages(baseMessages, localeMessages) as Messages;
}
