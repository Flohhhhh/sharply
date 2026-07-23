import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import messages from "../../messages/en.json";
import CameraFields from "~/app/[locale]/(pages)/gear/_components/edit-gear/fields-cameras";
import type { EnrichedCameraSpecs, GearItem } from "~/types/gear";

function renderCameraFields(
  hasAutofocus: boolean | null,
  hasVideo: boolean | null = null,
) {
  return renderToStaticMarkup(
    React.createElement(NextIntlClientProvider, {
      locale: "en",
      messages,
      timeZone: "America/New_York",
      children: React.createElement(CameraFields, {
        gearItem: { cameraCardSlots: [] } as unknown as GearItem,
        currentSpecs: {
          hasAutofocus,
          hasVideo,
          focusPoints: 693,
          afAreaModes: [],
          afSubjectCategories: [],
          hasFocusBracketing: true,
          hasFocusPeaking: true,
          hasLogColorProfile: true,
          has10BitVideo: true,
          has12BitVideo: true,
          hasOpenGateVideo: true,
          supportsExternalRecording: true,
          supportsRecordToDrive: true,
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

describe("CameraFields video gating", () => {
  it.each([null, false])(
    "locks video-dependent fields when video support is %o",
    (hasVideo) => {
      const markup = renderCameraFields(true, hasVideo);

      expect(markup).toContain("Has Video");
      expect(markup).toMatch(/id="hasLogColorProfile"[^>]*tabindex="-1"/);
      expect(markup).toMatch(/id="has10BitVideo"[^>]*tabindex="-1"/);
      expect(markup).toMatch(/Open Video Modes Manager<\/button>/);
      expect(markup).toMatch(/disabled="">Open Video Modes Manager/);
    },
  );

  it("enables video-dependent fields when video support is available", () => {
    const markup = renderCameraFields(true, true);

    expect(markup).toContain("Has Video");
    expect(markup).toMatch(/id="hasLogColorProfile"[^>]*tabindex="0"/);
    expect(markup).not.toMatch(/disabled="">Open Video Modes Manager/);
  });

  it("keeps a false video capability reversible in missing-only mode", () => {
    const markup = renderToStaticMarkup(
      React.createElement(NextIntlClientProvider, {
        locale: "en",
        messages,
        timeZone: "America/New_York",
        children: React.createElement(CameraFields, {
          gearItem: { cameraCardSlots: [] } as unknown as GearItem,
          initialSpecs: {
            hasVideo: false,
            afAreaModes: [],
          } as EnrichedCameraSpecs,
          currentSpecs: {
            hasVideo: false,
            afAreaModes: [],
          } as EnrichedCameraSpecs,
          showMissingOnly: true,
          onChange: () => {},
        }),
      }),
    );

    expect(markup).toContain("Has Video");
    expect(markup).toContain('id="hasVideo"');
  });
});
