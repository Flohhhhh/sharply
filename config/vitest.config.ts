import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const configDirectoryName = path.dirname(fileURLToPath(import.meta.url));
const workspaceRootPath = path.resolve(configDirectoryName, "..");

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(workspaceRootPath, "src"),
      "~": path.resolve(workspaceRootPath, "src"),
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // `all`-style reporting: files matched by `include` that no test imports
      // must appear at 0% — the empty domains are the whole point of the map.
      include: ["src/server/**", "src/lib/**", "src/hooks/**"],
      exclude: [
        "src/lib/generated/**",
        "**/*.d.ts",
      ],
      reportsDirectory: path.resolve(workspaceRootPath, "coverage"),
      reporter: process.env.CI
        ? ["text-summary", "json-summary", "html"]
        : ["text-summary"],
    },
  },
});
