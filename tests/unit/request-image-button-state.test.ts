import { describe, expect, it } from "vitest";

import { resolveRequestImageButtonState } from "~/app/[locale]/(pages)/gear/_components/request-image-button-state";

describe("resolveRequestImageButtonState", () => {
  it("hides the control while hydration is unresolved", () => {
    expect(
      resolveRequestImageButtonState({
        initialHasRequested: null,
        hydratedHasRequested: undefined,
        hasHydrationError: false,
        optimisticHasRequested: null,
      }),
    ).toEqual({
      hasRequested: false,
      shouldRender: false,
      shouldShowHelper: false,
    });
  });

  it("shows the request state when hydration resolves false", () => {
    expect(
      resolveRequestImageButtonState({
        initialHasRequested: null,
        hydratedHasRequested: false,
        hasHydrationError: false,
        optimisticHasRequested: null,
      }),
    ).toEqual({
      hasRequested: false,
      shouldRender: true,
      shouldShowHelper: true,
    });
  });

  it("shows the requested state when hydration resolves true", () => {
    expect(
      resolveRequestImageButtonState({
        initialHasRequested: null,
        hydratedHasRequested: true,
        hasHydrationError: false,
        optimisticHasRequested: null,
      }),
    ).toEqual({
      hasRequested: true,
      shouldRender: true,
      shouldShowHelper: false,
    });
  });

  it("keeps the control hidden when hydration fails without a known state", () => {
    expect(
      resolveRequestImageButtonState({
        initialHasRequested: null,
        hydratedHasRequested: null,
        hasHydrationError: true,
        optimisticHasRequested: null,
      }),
    ).toEqual({
      hasRequested: false,
      shouldRender: false,
      shouldShowHelper: false,
    });
  });

  it("prefers the optimistic requested state after submission", () => {
    expect(
      resolveRequestImageButtonState({
        initialHasRequested: null,
        hydratedHasRequested: false,
        hasHydrationError: false,
        optimisticHasRequested: true,
      }),
    ).toEqual({
      hasRequested: true,
      shouldRender: true,
      shouldShowHelper: false,
    });
  });
});
