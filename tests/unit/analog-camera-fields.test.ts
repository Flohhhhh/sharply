import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe,expect,it } from "vitest";

import messages from "../../messages/en.json";
import { AnalogCameraFields } from "~/app/[locale]/(pages)/gear/_components/edit-gear/fields-analog-cameras";
import type { AnalogCameraSpecs } from "~/types/gear";

function renderAnalogCameraFields(currentSpecs: AnalogCameraSpecs) {
  return renderToStaticMarkup(
    React.createElement(
      NextIntlClientProvider,
      {
        locale: "en",
        messages,
        timeZone: "America/New_York",
        children: React.createElement(AnalogCameraFields, {
          currentSpecs,
          onChange: () => {},
        }),
      },
    ),
  );
}

describe("AnalogCameraFields", () => {
  it("renders shutter controls with the same labels and unit chrome as digital camera fields", () => {
    const markup = renderAnalogCameraFields({
      shutterSpeedMax: 1,
      shutterSpeedMin: 4000,
      flashSyncSpeed: 250,
    } as AnalogCameraSpecs);

    expect(markup).toContain("Longest Shutter Speed");
    expect(markup).toContain("Fastest Shutter Speed");
    expect(markup).toContain("Flash Sync Speed");
    expect(markup).toContain("sec.");
    expect(markup.match(/1\//g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("renders max continuous fps with decimal input behavior like digital camera fields", () => {
    const markup = renderAnalogCameraFields({
      hasContinuousDrive: true,
      maxContinuousFps: "3.5",
    } as AnalogCameraSpecs);

    expect(markup).toContain("Max Continuous FPS");
    expect(markup).toContain('inputMode="decimal"');
    expect(markup).toContain('pattern="\\d+(?:\\.\\d*)?"');
    expect(markup).toContain(">fps<");
    expect(markup).toContain('value="3.5"');
  });

  it("does not pass NaN into the max continuous fps input for malformed values", () => {
    const markup = renderAnalogCameraFields({
      hasContinuousDrive: true,
      maxContinuousFps: "not-a-number",
    } as AnalogCameraSpecs);

    expect(markup).toContain("Max Continuous FPS");
    expect(markup).not.toContain('value="NaN"');
  });
});
