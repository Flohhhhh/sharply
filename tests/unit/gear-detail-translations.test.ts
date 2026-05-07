import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const messagesDirectory = path.join(process.cwd(), "messages");

type GearDetailMessages = {
  gearDetail?: Record<string, unknown>;
};

function readGearDetailMessages(localeFileName: string) {
  const localePath = path.join(messagesDirectory, localeFileName);
  const localeMessages = JSON.parse(
    fs.readFileSync(localePath, "utf8"),
  ) as GearDetailMessages;

  return localeMessages.gearDetail ?? {};
}

function getPathValue(
  source: Record<string, unknown>,
  path: string,
): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, source);
}

describe("gear detail heading translations", () => {
  it("keeps gear detail edit and review labels localized for every shipped locale", () => {
    const enMessages = readGearDetailMessages("en.json");
    const enKeys = Object.keys(enMessages);
    const requiredPaths = [
      "review",
      "reviews",
      "alternatives",
      "reviewsRequestFailed",
      "reviewRateLimitSuffix",
      "editGear.title",
      "editGear.unsaved",
      "editGear.showMissingOnly",
      "editGear.autoSubmit",
      "editGear.submitSuggestionTitle",
      "editGear.confirmSubmit",
      "editGear.sections.cameraSpecifications",
      "editGear.sections.lensSpecifications",
      "editGear.sections.analogCameraSpecifications",
      "editGear.options.cameraShutterTypes.mechanical",
      "editGear.options.viewfinderType.optical",
      "editGear.cardSlots.manage",
      "editGear.videoModes.title",
      "editGear.fields.aperture",
      "editGear.fields.sensorStackingType",
      "editGear.fields.isoMinNative",
      "editGear.fields.selectAvailableShutterTypesFirst",
      "editGear.fields.mountMaterialPlaceholder",
      "editGear.fields.analogBatteryPlaceholder",
      "editGear.fields.bestUseCases",
      "editGear.notes.add",
      "reviewGenres.weddings",
      "reviewGenres.video",
      "reviewGenres.architecture",
    ];

    // English canonical values
    expect(enMessages).toMatchObject({
      review: "Review",
      reviews: "Reviews",
      alternatives: "Alternatives",
    });
    expect(getPathValue(enMessages, "editGear.title")).toBe("Edit Gear Item");
    expect(getPathValue(enMessages, "reviewGenres.weddings")).toBe("Weddings");

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
      for (const path of requiredPaths) {
        expect(getPathValue(messages, path)).toBeTruthy();
      }
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
