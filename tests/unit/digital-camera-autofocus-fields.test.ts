import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import messages from "../../messages/en.json";
import CameraFields from "~/app/[locale]/(pages)/gear/_components/edit-gear/fields-cameras";
import type { EnrichedCameraSpecs, GearItem } from "~/types/gear";

function renderCameraFields(hasAutofocus: boolean | null) {
  return renderToStaticMarkup(
    React.createElement(NextIntlClientProvider, {
      locale: "en",
      messages,
      timeZone: "America/New_York",
      children: React.createElement(CameraFields, {
        gearItem: { cameraCardSlots: [] } as unknown as GearItem,
        currentSpecs: {
          hasAutofocus,
          focusPoints: 693,
          afAreaModes: [],
          afSubjectCategories: [],
          hasFocusBracketing: true,
          hasFocusPeaking: true,
        } as unknown as EnrichedCameraSpecs,
        onChange: () => {},
      }),
    }),
  );
}

describe("CameraFields autofocus gating", () => {
  it("locks AF-dependent fields while autofocus is unset", () => {
    const markup = renderCameraFields(null);

    expect(markup).toContain("Has Autofocus");
    expect(markup).toContain('id="focusPoints"');
    expect(markup).toMatch(/id="focusPoints"[^>]*disabled=""/);
    expect(markup).toContain("Has Focus Peaking");
  });

  it("locks AF-dependent fields when autofocus is explicitly unavailable", () => {
    const markup = renderCameraFields(false);

    expect(markup).toContain("Has Autofocus");
    expect(markup).toMatch(/id="focusPoints"[^>]*disabled=""/);
    expect(markup).toContain('id="afAreaModes"');
    expect(markup).toContain('id="afSubjectCategories"');
    expect(markup).toContain("Has Focus Bracketing");
    expect(markup).toContain("Has Focus Peaking");
  });

  it("enables AF-dependent fields when autofocus is available", () => {
    const markup = renderCameraFields(true);

    expect(markup).toContain('id="focusPoints"');
    expect(markup).not.toMatch(/id="focusPoints"[^>]*disabled=""/);
    expect(markup).toContain('id="afAreaModes"');
    expect(markup).toContain('id="afSubjectCategories"');
    expect(markup).toContain("Has Focus Bracketing");
  });
});
