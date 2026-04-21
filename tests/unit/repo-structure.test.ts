import fs from "node:fs";
import path from "node:path";
import { describe,expect,it } from "vitest";

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, "src");
const serverRoot = path.join(srcRoot, "server");

type ImportRecord = {
  specifier: string;
  index: number;
};

function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    if (entry.name.startsWith(".")) {
      return [];
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(fullPath);
    }

    if (!/\.(ts|tsx)$/.test(entry.name)) {
      return [];
    }

    return [fullPath];
  });
}

function toProjectPath(filePath: string) {
  return path.relative(projectRoot, filePath).replaceAll(path.sep, "/");
}

function readFile(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

function findImports(source: string): ImportRecord[] {
  const matches = source.matchAll(
    /(?:^|\n)\s*(?:import|export)\s+(?:type\s+)?(?:[^"']+?\s+from\s+)?["']([^"']+)["']/g,
  );

  return Array.from(matches, (match) => ({
    specifier: match[1]!,
    index: match.index ?? 0,
  }));
}

function startsWithUseServer(source: string) {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines[0] === '"use server";' || lines[0] === "'use server';";
}

describe("repo structure guardrails", () => {
  const srcFiles = walkFiles(srcRoot);
  const serverFiles = walkFiles(serverRoot);

  it("keeps server actions explicitly marked with use server", () => {
    const offenders = serverFiles
      .filter((filePath) => filePath.endsWith("/actions.ts"))
      .filter((filePath) => !startsWithUseServer(readFile(filePath)))
      .map(toProjectPath);

    expect(offenders).toEqual([]);
  });

  it("prevents server actions from importing data modules directly", () => {
    const offenders = serverFiles
      .filter((filePath) => filePath.endsWith("/actions.ts"))
      .flatMap((filePath) => {
        const imports = findImports(readFile(filePath));

        return imports
          .filter(({ specifier }) => {
            return (
              specifier === "./data" ||
              specifier === "../data" ||
              specifier.endsWith("/data") ||
              specifier.includes("/data/")
            );
          })
          .map(({ specifier }) => `${toProjectPath(filePath)} -> ${specifier}`);
      });

    expect(offenders).toEqual([]);
  });

  it("prevents non-server files from importing server data modules", () => {
    const offenders = srcFiles
      .filter((filePath) => !filePath.startsWith(serverRoot))
      .flatMap((filePath) => {
        const imports = findImports(readFile(filePath));

        return imports
          .filter(({ specifier }) => {
            return (
              specifier.startsWith("~/server/") &&
              (specifier.endsWith("/data") || specifier.includes("/data/"))
            );
          })
          .map(({ specifier }) => `${toProjectPath(filePath)} -> ${specifier}`);
      });

    expect(offenders).toEqual([]);
  });

  it("keeps lib modules free of direct server imports", () => {
    const libRoot = path.join(srcRoot, "lib");
    const offenders = walkFiles(libRoot).flatMap((filePath) => {
      const imports = findImports(readFile(filePath));

      return imports
        .filter(({ specifier }) => specifier.startsWith("~/server/"))
        .map(({ specifier }) => `${toProjectPath(filePath)} -> ${specifier}`);
    });

    expect(offenders).toEqual([]);
  });
});
