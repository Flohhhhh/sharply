import { getRequestConfig } from "next-intl/server";
import { defaultLocale,isLocale } from "./config";
import { getMessagesForLocale } from "./messages";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    messages: await getMessagesForLocale(locale),
    timeZone: "UTC",
  };
});
