import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { createTranslator } from "use-intl/core";
import { describe, expect, it } from "vitest";

const messagesDirectory = path.join(process.cwd(), "messages");
const locales = ["en", "de", "es", "fr", "it", "ja", "ms", "zh"];

type LocaleMessages = {
  auth: Record<string, string>;
  nav: {
    termsOfService: string;
    privacyPolicy: string;
  };
};

function readLocaleMessages(locale: string): LocaleMessages {
  return JSON.parse(
    fs.readFileSync(path.join(messagesDirectory, `${locale}.json`), "utf8"),
  ) as LocaleMessages;
}

describe("auth consent translations", () => {
  it("renders localized Terms of Service and Privacy Policy links", () => {
    for (const locale of locales) {
      const localeMessages = readLocaleMessages(locale);
      const errors: string[] = [];
      const translator = createTranslator({
        locale,
        messages: { auth: localeMessages.auth },
        namespace: "auth",
        onError: (error) => errors.push(error.message),
      });

      for (const key of ["agreeToTerms", "agreeToTermsVerify"]) {
        const markup = renderToStaticMarkup(
          translator.rich(key, {
            terms: (chunks) =>
              createElement("a", { href: "/terms-of-service" }, chunks),
            privacy: (chunks) =>
              createElement("a", { href: "/privacy-policy" }, chunks),
            termsLabel: localeMessages.nav.termsOfService,
            privacyLabel: localeMessages.nav.privacyPolicy,
          }),
        );

        expect(markup).toContain('href="/terms-of-service"');
        expect(markup).toContain('href="/privacy-policy"');
        expect(markup).toContain(localeMessages.nav.termsOfService);
        expect(markup).toContain(localeMessages.nav.privacyPolicy);
      }

      expect(errors).toEqual([]);
    }
  });
});
