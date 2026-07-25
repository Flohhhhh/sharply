import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (filename: string) =>
  fs.readFileSync(path.resolve(process.cwd(), filename), "utf8");

describe("Payload media storage configuration", () => {
  it("uses Vercel Blob client uploads without random filename suffixes", () => {
    const source = read("src/payload.config.ts");
    expect(source).toContain(
      'import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob"',
    );
    expect(source).toContain("clientUploads: {");
    expect(source).toContain('user?.role === "editor"');
    expect(source).toContain('user?.role === "admin"');
    expect(source).toContain('user?.role === "superadmin"');
    expect(source).toContain("addRandomSuffix: false");
    expect(source).toContain("token: process.env.BLOB_READ_WRITE_TOKEN");
    expect(source).not.toContain('from "@payloadcms/storage-uploadthing"');
  });

  it("keeps all Blob environment variables optional", () => {
    const source = read("src/env.js");
    for (const name of [
      "BLOB_READ_WRITE_TOKEN",
      "BLOB_STORE_ID",
      "BLOB_WEBHOOK_PUBLIC_KEY",
    ]) {
      expect(source).toContain(`${name}: z.string().optional()`);
    }
  });

  it("retains UploadThing for non-Payload upload features", () => {
    const packageJson = read("package.json");
    expect(packageJson).toContain('"@uploadthing/react"');
    expect(packageJson).toContain('"uploadthing"');
    expect(read("src/env.js")).toContain("UPLOADTHING_TOKEN");
  });
});
