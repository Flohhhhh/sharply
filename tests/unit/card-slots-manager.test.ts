import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import CardSlotsManager from "~/app/[locale]/(pages)/gear/_components/edit-gear/card-slots-manager";
import {
  translateGearDetailWithFallback,
  type GearDetailTranslator,
} from "~/lib/i18n/gear-detail";

function renderCardSlotsManager(
  value: React.ComponentProps<typeof CardSlotsManager>["value"],
  messages: Record<string, unknown>,
) {
  return renderToStaticMarkup(
    React.createElement(
      NextIntlClientProvider,
      {
        locale: "en",
        messages,
        timeZone: "America/New_York",
        children: React.createElement(CardSlotsManager, {
          value,
          onChange: () => {},
        }),
      },
    ),
  );
}

describe("CardSlotsManager", () => {
  it("interpolates fallback summary text when gear detail translations are missing", () => {
    const markup = renderCardSlotsManager(
      [
        {
          slotIndex: 1,
          supportedFormFactors: ["sd"],
          supportedBuses: ["uhs_ii"],
          supportedSpeedClasses: ["v90"],
        },
        {
          slotIndex: 2,
          supportedFormFactors: [],
          supportedBuses: [],
          supportedSpeedClasses: [],
        },
      ],
      { gearDetail: {} },
    );

    expect(markup).toContain("S1: SD | UHS II | V90");
    expect(markup).toContain("S2: (empty)");
    expect(markup).not.toContain("{index}");
    expect(markup).not.toContain("{details}");
  });
});

describe("translateGearDetailWithFallback", () => {
  it("interpolates fallback placeholders when a key is missing", () => {
    const translator = Object.assign(
      () => {
        throw new Error("missing translation");
      },
      {
        has: () => false,
      },
    ) as GearDetailTranslator;

    expect(
      translateGearDetailWithFallback(
        translator,
        "editGear.slotLabel",
        "Slot {index}",
        { index: 2 },
      ),
    ).toBe("Slot 2");
  });
});
