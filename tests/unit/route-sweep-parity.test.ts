import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import messages from "../../messages/en.json";
import {
  ERROR_BOUNDARY_TEXT,
  routeManifest,
  skippedRoutes,
} from "../playwright/utils/route-manifest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(testDir, "../../src/app");

/** Derive route patterns from the filesystem, mirroring Next's conventions. */
function routePatternsFromFilesystem(): string[] {
  const pages = fs
    .readdirSync(appDir, { recursive: true, encoding: "utf8" })
    .filter((p) => path.basename(p) === "page.tsx");

  const patterns = new Set<string>();
  for (const page of pages) {
    const rawSegments = path.dirname(page).split(path.sep);
    // Interception routes ((.)edit etc.) duplicate their target route —
    // the sweep tests the target, so drop the whole page.
    if (rawSegments.some((seg) => /^\(\.{1,3}\)/.test(seg))) continue;
    const segments = rawSegments.filter(
      (seg) =>
        seg !== "." &&
        !(seg.startsWith("(") && seg.endsWith(")")) && // route groups
        !seg.startsWith("@"), // parallel route slots
    );
    if (segments[0] === "[locale]") segments.shift();
    patterns.add(segments.length === 0 ? "/" : `/${segments.join("/")}`);
  }
  return [...patterns].sort();
}

describe("route sweep parity", () => {
  it("every app route is in the sweep manifest or explicitly skipped", () => {
    const covered = new Set(routeManifest.map((r) => r.pattern));
    const unaccounted = routePatternsFromFilesystem().filter(
      (p) => !covered.has(p) && !(p in skippedRoutes),
    );
    expect(
      unaccounted,
      "New routes must be added to tests/playwright/utils/route-manifest.ts (or its skip list, with a reason)",
    ).toEqual([]);
  });

  it("manifest and skip list reference only live routes, without overlap", () => {
    const live = new Set(routePatternsFromFilesystem());
    for (const r of routeManifest) {
      expect(live.has(r.pattern), `manifest references removed route ${r.pattern}`).toBe(true);
      expect(r.pattern in skippedRoutes, `${r.pattern} is both swept and skipped`).toBe(false);
    }
    for (const p of Object.keys(skippedRoutes)) {
      expect(live.has(p), `skip list references removed route ${p}`).toBe(true);
    }
  });

  it("ERROR_BOUNDARY_TEXT stays in sync with the error boundary's actual copy", () => {
    // src/app/[locale]/error.tsx: useTranslations("errors") + t("genericTitle").
    expect(
      ERROR_BOUNDARY_TEXT,
      "route-manifest.ts's ERROR_BOUNDARY_TEXT and messages/en.json's errors.genericTitle must move together — the sweep's error-boundary-absent check silently passes vacuously if they drift apart",
    ).toBe(messages.errors.genericTitle);
  });
});
