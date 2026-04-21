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
  },
});
