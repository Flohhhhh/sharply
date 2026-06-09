import { beforeEach,describe,expect,it,vi } from "vitest";

const botIdMocks = vi.hoisted(() => ({
  classifyBotTraffic: vi.fn(),
}));

const contactServiceMocks = vi.hoisted(() => ({
  submitContactMessage: vi.fn(),
}));

vi.mock("~/server/security/botid", () => botIdMocks);
vi.mock("~/server/contact/service", () => contactServiceMocks);

import { POST } from "~/app/api/contact/route";

describe("contact route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    botIdMocks.classifyBotTraffic.mockResolvedValue({ isBot: false });
  });

  it("rejects bot-classified submissions before the contact service runs", async () => {
    botIdMocks.classifyBotTraffic.mockResolvedValue({ isBot: true });

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "contribute",
          name: "Alex Example",
          email: "alex@example.com",
          subject: "Interested in contributing",
          message: "This message is comfortably longer than twenty characters.",
        }),
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({
      ok: false,
      message: "Unable to send message. Please try again later.",
    });
    expect(contactServiceMocks.submitContactMessage).not.toHaveBeenCalled();
  });

  it("passes valid human submissions to the contact service", async () => {
    contactServiceMocks.submitContactMessage.mockResolvedValue({ ok: true });

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "contribute",
          name: "Alex Example",
          email: "alex@example.com",
          subject: "Interested in contributing",
          message: "This message is comfortably longer than twenty characters.",
          honeypot: "",
          startedAt: 1712345678901,
        }),
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(contactServiceMocks.submitContactMessage).toHaveBeenCalledWith(
      {
        reason: "contribute",
        name: "Alex Example",
        email: "alex@example.com",
        subject: "Interested in contributing",
        message: "This message is comfortably longer than twenty characters.",
      },
      {
        honeypot: "",
        startedAt: 1712345678901,
        route: "/contact",
      },
    );
  });
});
