import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Regression: tenure badges use `createdAt` in `getUserSnapshot`; the cron
 * must filter on the same column. `emailVerified` is a boolean and cannot
 * be used with `to_char(..., 'MM-DD')`.
 */
describe("fetchUsersWithAnniversaryToday source", () => {
  it("uses createdAt for calendar month-day, not emailVerified", () => {
    const testDirectoryPath = path.dirname(fileURLToPath(import.meta.url));
    const serviceFilePath = path.join(
      testDirectoryPath,
      "../../src/server/users/service.ts",
    );
    const serviceSource = readFileSync(serviceFilePath, "utf8");
    const functionStart = serviceSource.indexOf(
      "export async function fetchUsersWithAnniversaryToday",
    );
    expect(functionStart).toBeGreaterThanOrEqual(0);
    const nextExport = serviceSource.indexOf(
      "\nexport async function ",
      functionStart + 1,
    );
    const functionBody = serviceSource.slice(
      functionStart,
      nextExport === -1 ? undefined : nextExport,
    );
    expect(functionBody).toContain("users.createdAt");
    expect(functionBody).not.toContain("emailVerified");
  });
});
