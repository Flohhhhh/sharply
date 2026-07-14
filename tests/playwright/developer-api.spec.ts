import { expect, test } from "@playwright/test";

test.describe("developer API", () => {
  test("rejects an unauthenticated public request with the documented error shape", async ({
    request,
  }) => {
    const response = await request.get("/api/v1/search?q=nikon");

    expect(response.status()).toBe(401);
    expect(response.headers()["x-request-id"]).toBeTruthy();
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "missing_api_key" },
      meta: { requestId: expect.any(String) },
    });
  });

  test("protects both live spec endpoints with the same API-key gate", async ({
    request,
  }) => {
    const [catalog, selected] = await Promise.all([
      request.get("/api/v1/specs"),
      request.get("/api/v1/gear/nikon-z6-iii/specs?fields=camera.sensor"),
    ]);

    for (const response of [catalog, selected]) {
      expect(response.status()).toBe(401);
      expect(response.headers()["x-request-id"]).toBeTruthy();
      await expect(response.json()).resolves.toMatchObject({
        error: { code: "missing_api_key" },
      });
    }
  });
});
