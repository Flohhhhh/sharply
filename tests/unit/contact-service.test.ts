/*
These tests protect contact-form safety checks and failure handling.
They verify spam blocks, minimum wait-time checks, and success/failure email behavior with mocks.
That gives confidence the contact flow stays safe and user-friendly.
*/

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONTACT_MIN_SUBMIT_MS } from "~/lib/contact/contact-schema";

const emailMocks = vi.hoisted(() => ({
  sendContactEmail: vi.fn(),
}));

vi.mock("~/server/contact/email", () => emailMocks);
vi.mock("server-only", () => ({}));

import { submitContactMessage } from "~/server/contact/service";

const input = {
  reason: "technical-issue" as const,
  name: "Test User",
  email: "test@example.com",
  subject: "Need help",
  message: "This is a long enough message to pass validation.",
  referenceUrl: undefined,
  company: undefined,
};

describe("contact service guardrails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emailMocks.sendContactEmail.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks honeypot submissions and does not send email", async () => {
    const result = await submitContactMessage(input, {
      honeypot: "spam-value",
      route: "/contact",
    });

    expect(result).toEqual({
      ok: false,
      message: "Unable to send message. Please try again later.",
    });
    expect(emailMocks.sendContactEmail).not.toHaveBeenCalled();
  });

  it("blocks submissions sent too quickly after form start", async () => {
    vi.spyOn(Date, "now").mockReturnValue(10_000);

    const result = await submitContactMessage(input, {
      startedAt: 10_000 - (CONTACT_MIN_SUBMIT_MS - 1),
      route: "/contact",
    });

    expect(result).toEqual({
      ok: false,
      message: "Please take a moment before submitting the form.",
    });
    expect(emailMocks.sendContactEmail).not.toHaveBeenCalled();
  });

  it("returns a safe generic error when email sending fails", async () => {
    emailMocks.sendContactEmail.mockResolvedValue({ ok: false });

    const result = await submitContactMessage(input, {
      route: "/contact",
      startedAt: 1,
    });

    expect(result).toEqual({
      ok: false,
      message: "Unable to send message. Please try again later.",
    });
  });

  it("sends email payload with route and timestamp on success", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-06T12:00:00.000Z"));

    const result = await submitContactMessage(input, {
      route: "/contact",
    });

    expect(result).toEqual({ ok: true });
    expect(emailMocks.sendContactEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/contact",
        timestamp: "2026-03-06T12:00:00.000Z",
      }),
    );
  });
});
