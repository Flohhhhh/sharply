import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const runFullBrowserMatrix = process.env.PLAYWRIGHT_ALL_PROJECTS === "true";
const shouldManageServer = !process.env.PLAYWRIGHT_BASE_URL;
const configDirectoryName = path.dirname(fileURLToPath(import.meta.url));
const workspaceRootPath = path.resolve(configDirectoryName, "..");

const setupProject = {
  name: "setup",
  testMatch: /auth\.setup\.ts/,
};

// The storage-state cookies produced by the chromium-run setup project work
// in every browser project — it's a JSON cookie file, not a browser profile —
// so one setup run covers the whole matrix.
const withSetup = <T extends { name: string }>(browserProjects: T[]) => [
  setupProject,
  ...browserProjects.map((p) => ({ ...p, dependencies: ["setup"] })),
];

const projects = runFullBrowserMatrix
  ? withSetup([
      {
        name: "chromium",
        use: { ...devices["Desktop Chrome"] },
      },
      {
        name: "firefox",
        use: { ...devices["Desktop Firefox"] },
      },
      {
        name: "Mobile Chrome",
        use: { ...devices["Pixel 5"] },
      },
      {
        name: "Mobile Safari",
        use: { ...devices["iPhone 12"] },
      },
    ])
  : withSetup([
      {
        name: "chromium",
        use: { ...devices["Desktop Chrome"] },
      },
    ]);

export default defineConfig({
  testDir: path.join(workspaceRootPath, "tests/playwright"),
  outputDir: path.join(workspaceRootPath, "test-results"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Reporter/output paths are anchored to the repo root: Playwright resolves
  // relative paths against this config file's directory (config/), which would
  // strand artifacts outside .gitignore and break CI's report consumers.
  reporter: process.env.CI
    ? ([
        [
          "html",
          { outputFolder: path.join(workspaceRootPath, "playwright-report") },
        ],
        [
          "json",
          {
            outputFile: path.join(
              workspaceRootPath,
              "test-results/results.json",
            ),
          },
        ],
        ["github"],
      ] as const)
    : "list",
  use: {
    baseURL,
    trace: "retain-on-first-failure",
    screenshot: "only-on-failure",
  },
  projects,
  webServer: shouldManageServer
    ? {
        command: process.env.PLAYWRIGHT_SERVER_COMMAND ?? "npm run dev:e2e",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 120_000,
      }
    : undefined,
});
