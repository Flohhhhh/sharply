import path from "node:path";
import { fileURLToPath } from "node:url";

const utilsDir = path.dirname(fileURLToPath(import.meta.url));
export const STORAGE_STATE_PATH = path.resolve(
  utilsDir,
  "../../../test-results/.auth/dev-user.json",
);
