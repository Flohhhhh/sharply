import type defaultMessages from "../../messages/en.json";
import type { Locale } from "./config";
import { defaultLocale } from "./config";

type Messages = typeof defaultMessages;
type MessageOverrides = Record<string, unknown>;

const messageLoaders: Record<
  Locale,
  () => Promise<{ default: MessageOverrides }>
> = {
  en: () => import("../../messages/en.json") as Promise<{
    default: MessageOverrides;
  }>,
  ja: () => import("../../messages/ja.json") as Promise<{
    default: MessageOverrides;
  }>,
  de: () => import("../../messages/de.json") as Promise<{
    default: MessageOverrides;
  }>,
  fr: () => import("../../messages/fr.json") as Promise<{
    default: MessageOverrides;
  }>,
  es: () => import("../../messages/es.json") as Promise<{
    default: MessageOverrides;
  }>,
  it: () => import("../../messages/it.json") as Promise<{
    default: MessageOverrides;
  }>,
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
  const baseMessages = (await messageLoaders.en()).default as Messages;

  if (locale === defaultLocale) {
    return baseMessages;
  }

  const localeMessages = (await messageLoaders[locale]()).default;

  return mergeMessages(baseMessages, localeMessages) as Messages;
}
