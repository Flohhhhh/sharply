import { describe,expect,it } from "vitest";
import { botIdProtectedRoutes } from "~/lib/security/botid-protected-routes";

describe("BotID protected routes", () => {
  it("protects gear edit server action posts from gear and under-construction pages", () => {
    expect(botIdProtectedRoutes).toEqual(
      expect.arrayContaining([
        { path: "/gear/*", method: "POST" },
        { path: "/*/gear/*", method: "POST" },
        { path: "/lists/under-construction", method: "POST" },
        { path: "/*/lists/under-construction", method: "POST" },
      ]),
    );
  });
});
