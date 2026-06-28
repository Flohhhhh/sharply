import { describe,expect,it,vi } from "vitest";

import {
  createLeaveActionController,
  getGuardedLinkNavigationHref,
  getHistoryLeaveDelta,
  shouldWarnBeforeUnload,
} from "~/lib/hooks/useUnsavedChangesGuard";

describe("createLeaveActionController", () => {
  it("stores a dirty leave request until the user confirms it", () => {
    const controller = createLeaveActionController();
    const action = vi.fn();
    const execute = vi.fn((callback: () => void) => callback());

    expect(
      controller.requestLeave({
        action,
        isDirty: true,
      }),
    ).toBe(true);
    expect(controller.hasPendingLeave()).toBe(true);

    expect(controller.confirmLeave(execute)).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(1);
    expect(controller.hasPendingLeave()).toBe(false);
  });

  it("allows immediate leave when the form is clean or the request is forced", () => {
    const controller = createLeaveActionController();
    const cleanAction = vi.fn();
    const forceAction = vi.fn();
    const execute = vi.fn((callback: () => void) => callback());

    expect(
      controller.requestLeave({
        action: cleanAction,
        isDirty: false,
      }),
    ).toBe(false);
    expect(controller.confirmLeave(execute)).toBe(false);

    expect(
      controller.requestLeave({
        action: forceAction,
        force: true,
        isDirty: true,
      }),
    ).toBe(false);
    expect(controller.confirmLeave(execute)).toBe(false);

    expect(cleanAction).not.toHaveBeenCalled();
    expect(forceAction).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it("clears a pending leave when the user cancels", () => {
    const controller = createLeaveActionController();

    controller.requestLeave({
      action: vi.fn(),
      isDirty: true,
    });

    controller.cancelLeave();

    expect(controller.hasPendingLeave()).toBe(false);
  });
});

describe("getGuardedLinkNavigationHref", () => {
  it("returns an internal same-tab href that should be guarded", () => {
    expect(
      getGuardedLinkNavigationHref({
        currentOrigin: "https://sharply.test",
        href: "https://sharply.test/gear/nikon-zf?edit=1#top",
      }),
    ).toBe("/gear/nikon-zf?edit=1#top");
  });

  it("ignores same-document hash navigation", () => {
    expect(
      getGuardedLinkNavigationHref({
        currentOrigin: "https://sharply.test",
        currentPathname: "/gear/nikon-zf",
        currentSearch: "?edit=1",
        href: "https://sharply.test/gear/nikon-zf?edit=1#specs",
      }),
    ).toBeNull();
  });

  it("ignores modified clicks, new tabs, downloads, and external links", () => {
    expect(
      getGuardedLinkNavigationHref({
        ctrlKey: true,
        currentOrigin: "https://sharply.test",
        href: "https://sharply.test/gear/nikon-zf",
      }),
    ).toBeNull();

    expect(
      getGuardedLinkNavigationHref({
        currentOrigin: "https://sharply.test",
        href: "https://sharply.test/gear/nikon-zf",
        target: "_blank",
      }),
    ).toBeNull();

    expect(
      getGuardedLinkNavigationHref({
        currentOrigin: "https://sharply.test",
        download: true,
        href: "https://sharply.test/gear/nikon-zf",
      }),
    ).toBeNull();

    expect(
      getGuardedLinkNavigationHref({
        currentOrigin: "https://sharply.test",
        href: "https://example.com/gear/nikon-zf",
      }),
    ).toBeNull();
  });
});

describe("unsaved changes guard helpers", () => {
  it("warns before unload only while dirty and not suppressed", () => {
    expect(
      shouldWarnBeforeUnload({
        isDirty: true,
        isSuppressed: false,
      }),
    ).toBe(true);

    expect(
      shouldWarnBeforeUnload({
        isDirty: false,
        isSuppressed: false,
      }),
    ).toBe(false);

    expect(
      shouldWarnBeforeUnload({
        isDirty: true,
        isSuppressed: true,
      }),
    ).toBe(false);
  });

  it("uses an extra back step when the history trap is armed", () => {
    expect(getHistoryLeaveDelta(false)).toBe(-1);
    expect(getHistoryLeaveDelta(true)).toBe(-2);
  });
});
