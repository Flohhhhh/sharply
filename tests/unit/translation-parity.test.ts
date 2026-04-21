import fs from "node:fs";
import path from "node:path";
import { describe,expect,it } from "vitest";

const projectRoot = process.cwd();
const messagesDirectory = path.join(projectRoot, "messages");
const sourceLocaleFileName = "en.json";

function readJsonFile(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function flattenObjectKeys(value: unknown, parentPath = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return parentPath ? [parentPath] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, nestedValue]) => {
      const keyPath = parentPath ? `${parentPath}.${key}` : key;
      return flattenObjectKeys(nestedValue, keyPath);
    },
  );
}

function formatDifferences(
  localeFileName: string,
  missingKeys: string[],
  extraKeys: string[],
) {
  const sections: string[] = [];

  if (missingKeys.length > 0) {
    sections.push(
      [
        `Missing keys in ${localeFileName}:`,
        ...missingKeys.map((key) => `  - ${key}`),
      ].join("\n"),
    );
  }

  if (extraKeys.length > 0) {
    sections.push(
      [`Extra keys in ${localeFileName}:`, ...extraKeys.map((key) => `  - ${key}`)].join(
        "\n",
      ),
    );
  }

  return sections.join("\n\n");
}

describe("translation key parity", () => {
  it("keeps locale message keys aligned with en.json", () => {
    const sourceLocalePath = path.join(messagesDirectory, sourceLocaleFileName);
    const sourceLocaleKeySet = new Set(flattenObjectKeys(readJsonFile(sourceLocalePath)));

    const localeFileNames = fs
      .readdirSync(messagesDirectory)
      .filter((fileName) => fileName.endsWith(".json"))
      .filter((fileName) => fileName !== sourceLocaleFileName)
      .sort();

    const mismatchDetails = localeFileNames.flatMap((localeFileName) => {
      const localePath = path.join(messagesDirectory, localeFileName);
      const localeKeySet = new Set(flattenObjectKeys(readJsonFile(localePath)));

      const missingKeys = Array.from(sourceLocaleKeySet).filter(
        (sourceKey) => !localeKeySet.has(sourceKey),
      );
      const extraKeys = Array.from(localeKeySet).filter(
        (localeKey) => !sourceLocaleKeySet.has(localeKey),
      );

      if (missingKeys.length === 0 && extraKeys.length === 0) {
        return [];
      }

      return [
        formatDifferences(
          localeFileName,
          missingKeys.sort(),
          extraKeys.sort(),
        ),
      ];
    });

    expect(mismatchDetails.join("\n\n")).toBe("");
  });
});
