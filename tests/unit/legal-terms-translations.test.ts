import fs from "node:fs";
import path from "node:path";
import { createElement, type ReactNode } from "react";
import { createTranslator } from "use-intl/core";
import { describe, expect, it } from "vitest";

const messagesDirectory = path.join(process.cwd(), "messages");

type LegalMessages = {
  legal?: {
    terms?: Record<string, unknown>;
  };
};

type RichTermsMessages = {
  privacyNotice: string;
  sections: {
    contact: {
      body: string;
    };
  };
};

function readTermsMessages(localeFileName: string) {
  const localePath = path.join(messagesDirectory, localeFileName);
  const localeMessages = JSON.parse(
    fs.readFileSync(localePath, "utf8"),
  ) as LegalMessages;

  return localeMessages.legal?.terms ?? {};
}

function getPathValue(
  source: Record<string, unknown>,
  keyPath: string,
): unknown {
  return keyPath.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, source);
}

describe("legal terms translations", () => {
  it("keeps the terms of service page content localized for every shipped locale", () => {
    const enMessages = readTermsMessages("en.json");
    const requiredPaths = [
      "title",
      "lastUpdated",
      "intro",
      "privacyNotice",
      "sections.whatSharplyIs.title",
      "sections.whatSharplyIs.body",
      "sections.account.title",
      "sections.account.item1",
      "sections.account.item2",
      "sections.account.item3",
      "sections.userContent.title",
      "sections.userContent.body1",
      "sections.userContent.body2",
      "sections.userContent.body3",
      "sections.prohibited.title",
      "sections.prohibited.item1",
      "sections.prohibited.item2",
      "sections.prohibited.item3",
      "sections.prohibited.item4",
      "sections.prohibited.item5",
      "sections.prohibited.item6",
      "sections.intellectualProperty.title",
      "sections.intellectualProperty.body",
      "sections.informationAccuracy.title",
      "sections.informationAccuracy.body",
      "sections.thirdPartyLinks.title",
      "sections.thirdPartyLinks.body",
      "sections.disclaimers.title",
      "sections.disclaimers.body",
      "sections.limitationOfLiability.title",
      "sections.limitationOfLiability.body",
      "sections.indemnification.title",
      "sections.indemnification.body",
      "sections.changes.title",
      "sections.changes.body",
      "sections.termination.title",
      "sections.termination.body",
      "sections.contact.title",
      "sections.contact.body",
    ];

    expect(enMessages.title).toBe("Terms of Service");

    const locales = [
      "en.json",
      "de.json",
      "es.json",
      "fr.json",
      "it.json",
      "ja.json",
      "ms.json",
      "zh.json",
    ];

    for (const locale of locales) {
      const messages = readTermsMessages(locale);

      for (const keyPath of requiredPaths) {
        expect(getPathValue(messages, keyPath)).toBeTruthy();
      }

      expect(getPathValue(messages, "privacyNotice")).toContain(
        "<privacyPolicy>{privacyPolicyLabel}</privacyPolicy>",
      );
      expect(getPathValue(messages, "sections.contact.body")).toContain(
        "<privacyPolicy>{privacyPolicyLabel}</privacyPolicy>",
      );
    }
  });

  it("formats the privacy policy links as rich text for every locale", () => {
    const locales = [
      "en.json",
      "de.json",
      "es.json",
      "fr.json",
      "it.json",
      "ja.json",
      "ms.json",
      "zh.json",
    ];

    for (const localeFileName of locales) {
      const errors: string[] = [];
      const translator = createTranslator({
        locale: localeFileName.replace(".json", ""),
        messages: {
          legal: {
            terms: readTermsMessages(localeFileName) as RichTermsMessages,
          },
        },
        namespace: "legal.terms",
        onError: (error) => errors.push(error.message),
      });
      const values = {
        privacyPolicy: (chunks: ReactNode) =>
          createElement("a", { href: "/privacy-policy" }, chunks),
        privacyPolicyLabel: "Privacy Policy",
      };

      expect(translator.rich("privacyNotice", values)).toBeTruthy();
      expect(translator.rich("sections.contact.body", values)).toBeTruthy();
      expect(errors).toEqual([]);
    }
  });
});
