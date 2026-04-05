import { execSync } from "node:child_process";

const shouldRunE2E = process.env.CHECK_E2E === "true";

if (!shouldRunE2E) {
  console.log("Skipping Playwright in npm run check. Set CHECK_E2E=true to include e2e.");
  process.exit(0);
}

execSync("npm run test:e2e", {
  stdio: "inherit",
});
