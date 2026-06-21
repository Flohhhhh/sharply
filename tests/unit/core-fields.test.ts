import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach,describe,expect,it,vi } from "vitest";

import messages from "../../messages/en.json";
import { CoreFields } from "~/app/[locale]/(pages)/gear/_components/edit-gear/fields-core";

vi.mock("~/lib/auth/auth-client", () => ({
  useSession: () => ({
    data: { session: { id: "session-1" }, user: { id: "user-1" } },
    isPending: false,
    error: null,
  }),
}));

vi.mock("~/lib/auth/auth-helpers", () => ({
  requireRole: () => true,
}));

function renderCoreFields(gearType: "CAMERA" | "ANALOG_CAMERA" | "LENS") {
  return renderToStaticMarkup(
    React.createElement(
      NextIntlClientProvider,
      {
        locale: "en",
        messages,
        timeZone: "America/New_York",
        children: React.createElement(CoreFields, {
          gearType,
          currentSpecs: {
            announcedDate: null,
            releaseDate: null,
            weightGrams: null,
            mountId: null,
            mountIds: [],
            genres: [],
          },
          initialSpecs: {
            announcedDate: null,
            releaseDate: null,
            weightGrams: null,
            mountId: null,
            mountIds: [],
            genres: [],
          },
          onChange: () => {},
        }),
      },
    ),
  );
}

describe("CoreFields mount input", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders analog cameras with the single-mount placeholder", () => {
    const markup = renderCoreFields("ANALOG_CAMERA");

    expect(markup).toContain("Select mount");
    expect(markup).not.toContain("Select compatible mounts");
  });

  it("keeps lenses on the multi-mount placeholder", () => {
    const markup = renderCoreFields("LENS");

    expect(markup).toContain("Select compatible mounts");
  });
});
