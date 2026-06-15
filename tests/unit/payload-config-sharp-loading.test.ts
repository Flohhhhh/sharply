import fs from "node:fs";
import path from "node:path";
import { describe,expect,it } from "vitest";

const payloadConfigPath = path.resolve(process.cwd(), "src/payload.config.ts");
const payloadConfigSource = fs.readFileSync(payloadConfigPath, "utf8");

describe("payload config sharp loading", () => {
  it("does not statically import sharp at module load time", () => {
    expect(payloadConfigSource).not.toContain('import sharp from "sharp"');
    expect(payloadConfigSource).toContain('await import("sharp")');
  });

  it("allows payload config to continue when sharp is unavailable", () => {
    expect(payloadConfigSource).toContain(
      "sharp unavailable, continuing without it",
    );
    expect(payloadConfigSource).toContain(
      "sharpAdapter ? { sharp: sharpAdapter } : {}",
    );
  });
});
