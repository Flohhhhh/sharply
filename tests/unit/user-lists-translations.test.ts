import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const messagesDirectory = path.join(process.cwd(), "messages");
const localeFileNames = fs
  .readdirSync(messagesDirectory)
  .filter((fileName) => fileName.endsWith(".json"))
  .sort();

type UserProfileMessages = {
  userProfile?: Record<string, unknown>;
};

function readLocaleMessages(
  localeFileName: string,
): NonNullable<UserProfileMessages["userProfile"]> {
  const localePath = path.join(messagesDirectory, localeFileName);
  const localeMessages = JSON.parse(
    fs.readFileSync(localePath, "utf8"),
  ) as UserProfileMessages;

  return localeMessages.userProfile ?? {};
}

describe("user list delete translations", () => {
  it("uses a single interpolated delete description key in every locale", () => {
    for (const localeFileName of localeFileNames) {
      const userProfileMessages = readLocaleMessages(localeFileName);

      expect(userProfileMessages.listsDeleteDescription).toEqual(
        expect.any(String),
      );
      expect(userProfileMessages.listsDeleteDescription).toContain("{name}");
      expect(userProfileMessages).not.toHaveProperty(
        "listsDeleteDescriptionPrefix",
      );
      expect(userProfileMessages).not.toHaveProperty(
        "listsDeleteDescriptionSuffix",
      );
    }
  });

  it("keeps the fallback list label available for delete copy", () => {
    for (const localeFileName of localeFileNames) {
      const userProfileMessages = readLocaleMessages(localeFileName);

      expect(userProfileMessages.listsThisList).toEqual(expect.any(String));
      expect((userProfileMessages.listsThisList as string).trim()).not.toBe("");
    }
  });
});
