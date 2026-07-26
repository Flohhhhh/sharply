import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { canManageMedia, Media } from "../../src/collections/Media";

const read = (filename: string) =>
  fs.readFileSync(path.resolve(process.cwd(), filename), "utf8");

describe("Payload media storage configuration", () => {
  it("uses gated Vercel Blob client uploads with collision-safe pathnames", () => {
    const source = read("src/payload.config.ts");
    expect(source).toContain(
      'import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob"',
    );
    expect(source).toContain("clientUploads: {");
    expect(source).toContain("access: canManageMedia");
    expect(source).toContain(
      "enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN)",
    );
    expect(source).toContain("addRandomSuffix: true");
    expect(source).toContain("token: process.env.BLOB_READ_WRITE_TOKEN");
    expect(read("src/collections/Media.ts")).toContain(
      "disableLocalStorage: Boolean(process.env.BLOB_READ_WRITE_TOKEN)",
    );
    expect(source).not.toContain('from "@payloadcms/storage-uploadthing"');
  });

  it("allows media writes only for editor roles and above", () => {
    expect(canManageMedia({ req: { user: { role: "editor" } } })).toBe(true);
    expect(canManageMedia({ req: { user: { role: "admin" } } })).toBe(true);
    expect(canManageMedia({ req: { user: { role: "superadmin" } } })).toBe(
      true,
    );
    expect(canManageMedia({ req: { user: { role: "user" } } })).toBe(false);
    expect(canManageMedia({ req: { user: null } })).toBe(false);
  });

  it("rejects caller-provided legacy UploadThing keys", () => {
    const legacyKeyField = Media.fields.find(
      (field) => "name" in field && field.name === "_key",
    );

    expect(legacyKeyField && "access" in legacyKeyField).toBe(true);
    if (!legacyKeyField || !("access" in legacyKeyField)) return;
    expect(legacyKeyField.access?.create?.({} as never)).toBe(false);
    expect(legacyKeyField.access?.update?.({} as never)).toBe(false);
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

  it("allows only the connected public Blob store through image optimization", () => {
    const source = read("next.config.js");
    expect(source).toContain(
      'hostname: "8ohygcz3uqpkb9ee.public.blob.vercel-storage.com"',
    );
    expect(source).toContain('pathname: "/**"');
    expect(source).not.toContain(
      'hostname: "*.public.blob.vercel-storage.com"',
    );
    expect(source).not.toContain(
      'hostname: "**.public.blob.vercel-storage.com"',
    );
  });

  it("retains UploadThing for non-Payload upload features", () => {
    const packageJson = read("package.json");
    expect(packageJson).toContain('"@uploadthing/react"');
    expect(packageJson).toContain('"uploadthing"');
    expect(read("src/env.js")).toContain("UPLOADTHING_TOKEN");
  });
});
