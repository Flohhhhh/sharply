import { describe, expect, it, vi } from "vitest";

import {
  createLinkButtonPressedResetTimer,
  LINK_BUTTON_PRESS_RESET_MS,
  shouldStartLinkButtonPressedState,
} from "~/components/ui/link-button";

describe("link button pressed-state helpers", () => {
  it("resets a pressed button if router pending never starts", () => {
    vi.useFakeTimers();

    const onReset = vi.fn();
    const timer = createLinkButtonPressedResetTimer(onReset);

    timer.schedule();

    vi.advanceTimersByTime(LINK_BUTTON_PRESS_RESET_MS - 1);
    expect(onReset).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onReset).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("cancels the fallback reset when a real pending transition takes over", () => {
    vi.useFakeTimers();

    const onReset = vi.fn();
    const timer = createLinkButtonPressedResetTimer(onReset, 25);

    timer.schedule();
    timer.clear();
    vi.runAllTimers();

    expect(onReset).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("skips the optimistic pressed state for new-tab links", () => {
    expect(
      shouldStartLinkButtonPressedState({
        altKey: false,
        button: 0,
        ctrlKey: false,
        currentTarget: {
          download: "",
          target: "_blank",
        } as HTMLAnchorElement,
        defaultPrevented: false,
        metaKey: false,
        shiftKey: false,
      }),
    ).toBe(false);
  });
});
