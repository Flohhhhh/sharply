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
import type { CollectionSlug } from "payload";

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
const LEARN_TITLE = "Sharply E2E seed learn page";
const REVIEW_TITLE = "Sharply E2E seed review";
// scripts/seed.ts (drizzle-based db:seed) creates this gear row; setup-local
// runs it right after this script and before the Playwright suite, so the
// slug exists by the time review pages resolve it via fetchGearBySlug.
const REVIEW_GEAR_SLUG = "nikon-z6iii";

/** Shape of every richText field's stored value across news, learn-pages,
 * and review (see payload-types.ts) — a plain object return type here (rather
 * than letting it be inferred) keeps root.format a literal union instead of
 * widening to `string`, which the generated collection types require. */
type LexicalRoot = {
  root: {
    type: string;
    children: { type: any; version: number; [k: string]: unknown }[];
    direction: "ltr" | "rtl" | null;
    format: "left" | "start" | "center" | "right" | "end" | "justify" | "";
    indent: number;
    version: number;
  };
};

/** Minimal single-paragraph lexical richText root, shared by every seeded
 * collection with a richText field (news/learn-pages/review all use this
 * exact shape). */
function lexicalParagraph(text: string): LexicalRoot {
  return {
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
              text,
            },
          ],
        },
      ],
    },
  };
}

async function docExists(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: CollectionSlug,
  title: string,
) {
  const existing = await payload.find({
    collection,
    where: { title: { equals: title } },
    limit: 1,
  });
  return existing.docs.length > 0;
}

async function main() {
  const { default: config } = await import("../../src/payload.config");
  const payload = await getPayload({ config });

  const [newsExists, learnExists, reviewExists] = await Promise.all([
    docExists(payload, "news", NEWS_TITLE),
    docExists(payload, "learn-pages", LEARN_TITLE),
    docExists(payload, "review", REVIEW_TITLE),
  ]);

  if (newsExists && learnExists && reviewExists) {
    console.log(
      "[e2e:bootstrap] news + learn page + review already present; nothing to do",
    );
    process.exit(0);
  }

  // Shared thumbnail — reused across whichever docs still need creating, same
  // as the pre-existing news-only bootstrap did.
  const media = await payload.create({
    collection: "media",
    data: { alt: "E2E seed thumbnail" },
    filePath: fixturePath,
  });

  const created: string[] = [];

  if (!newsExists) {
    await payload.create({
      collection: "news",
      draft: false,
      data: {
        title: NEWS_TITLE,
        thumbnail: media.id,
        _status: "published",
        content: lexicalParagraph(
          "Deterministic seed content for the e2e pipeline. The suite only asserts the card renders and navigates.",
        ),
      },
    });
    created.push("news");
  }

  if (!learnExists) {
    await payload.create({
      collection: "learn-pages",
      draft: false,
      data: {
        title: LEARN_TITLE,
        thumbnail: media.id,
        _status: "published",
        category: "basics", // real category => also gives /learn/basics data
        skill_level: "beginner",
        content: lexicalParagraph(
          "Deterministic learn content for the e2e sweep.",
        ),
        // command_aliases requires lowercase-letters-and-hyphens only (no
        // digits) — "e2e-seed" fails that field's validate() regex, hence
        // the spelled-out alias below.
        command_aliases: [{ alias: "sharply-seed-alias" }],
      },
    });
    created.push("learn page");
  }

  if (!reviewExists) {
    await payload.create({
      collection: "review",
      draft: false,
      data: {
        title: REVIEW_TITLE,
        thumbnail: media.id,
        _status: "published",
        // Plain text gear slug (not a relationship field) — see
        // REVIEW_GEAR_SLUG comment above for why this slug is safe to use
        // before scripts/seed.ts has run.
        review_gear_item: REVIEW_GEAR_SLUG,
        // review_summary has minLength: 100 — the brief's shorter snippet
        // fails Review.ts's validation, hence the longer copy below.
        review_summary:
          "Deterministic review summary for the e2e sweep. This fixture exists solely so the review detail and index pages have real published content to render against in CI.",
        goodPoints: [{ goodNote: "Renders deterministically" }],
        badPoints: [{ badNote: "Exists only for tests" }],
        reviewContent: lexicalParagraph(
          "Deterministic review content for the e2e sweep.",
        ),
      },
    });
    created.push("review");
  }

  console.log(`[e2e:bootstrap] created media + ${created.join(" + ")}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("[e2e:bootstrap] failed", error);
  process.exit(1);
});
