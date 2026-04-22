import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const messagesDirectory = path.join(process.cwd(), "messages");

type GearDetailMessages = {
  gearDetail?: {
    review?: string;
    reviews?: string;
    alternatives?: string;
  };
};

function readGearDetailMessages(localeFileName: string) {
  const localePath = path.join(messagesDirectory, localeFileName);
  const localeMessages = JSON.parse(
    fs.readFileSync(localePath, "utf8"),
  ) as GearDetailMessages;

  return localeMessages.gearDetail ?? {};
}

describe("gear detail heading translations", () => {
  it("keeps review and alternatives labels localized for every shipped locale", () => {
    const enMessages = readGearDetailMessages("en.json");
    const enKeys = Object.keys(enMessages);

    // English canonical values
    expect(enMessages).toMatchObject({
      review: "Review",
      reviews: "Reviews",
      alternatives: "Alternatives",
    });

    const locales = ["de.json", "es.json", "fr.json", "it.json", "ja.json", "ms.json"];

    for (const locale of locales) {
      const messages = readGearDetailMessages(locale);
      const keys = Object.keys(messages);

      // Parity check: all locales should have the same keys as English
      expect(keys.sort()).toEqual(enKeys.sort());

      // All required keys should have non-empty strings
      expect(messages.review).toBeTruthy();
      expect(messages.reviews).toBeTruthy();
      expect(messages.alternatives).toBeTruthy();
    }

    // Flag ms.json inconsistency for manual review: "review" is "Semakan" but "reviews" is "Ulasan"
    const msMessages = readGearDetailMessages("ms.json");
    if (msMessages.review === "Semakan" && msMessages.reviews === "Ulasan") {
      console.warn(
        "ms.json has inconsistent review terminology: review='Semakan' vs reviews='Ulasan'. This may need manual review.",
      );
    }
  });
});