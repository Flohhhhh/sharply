/**
 * E2E bootstrap: initializes the Payload Local API under NODE_ENV=development,
 * which triggers the postgres adapter's dev-mode schema push (this repo has no
 * Payload migrations — see docs/decisions/2026-08-31-hermetic-e2e-ci.md),
 * then seeds the minimal published content the Playwright suite asserts on.
 * Idempotent: safe to re-run against a dirty local database.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPayload } from "payload";

// Hermetic by design: a blob token inherited from the shell would make
// payload.config switch Media storage to the REAL Vercel Blob store and
// upload e2e fixtures into production storage. Delete it before the config
// is loaded (hence the dynamic import in main()).
delete process.env.BLOB_READ_WRITE_TOKEN;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(
  scriptDir,
  "../../tests/fixtures/news-thumbnail.png",
);

const NEWS_TITLE = "Sharply E2E seed news post";

async function main() {
  const { default: config } = await import("../../src/payload.config");
  const payload = await getPayload({ config });

  const existing = await payload.find({
    collection: "news",
    where: { title: { equals: NEWS_TITLE } },
    limit: 1,
  });
  if (existing.docs.length > 0) {
    console.log("[e2e:bootstrap] news post already present; nothing to do");
    process.exit(0);
  }

  const media = await payload.create({
    collection: "media",
    data: { alt: "E2E seed news thumbnail" },
    filePath: fixturePath,
  });

  await payload.create({
    collection: "news",
    draft: false,
    data: {
      title: NEWS_TITLE,
      thumbnail: media.id,
      _status: "published",
      content: {
        root: {
          type: "root",
          format: "",
          indent: 0,
          version: 1,
          direction: null,
          children: [
            {
              type: "paragraph",
              version: 1,
              direction: null,
              format: "",
              indent: 0,
              textFormat: 0,
              children: [
                {
                  type: "text",
                  version: 1,
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: "Deterministic seed content for the e2e pipeline. The suite only asserts the card renders and navigates.",
                },
              ],
            },
          ],
        },
      },
    },
  });

  console.log("[e2e:bootstrap] created media + published news post");
  process.exit(0);
}

main().catch((error) => {
  console.error("[e2e:bootstrap] failed", error);
  process.exit(1);
});
