import "server-only";
import { getPayload } from "payload";
import config from "~/payload.config";
import type { LearnPage, News, Review } from "~/payload-types";

export const getNewsPostsData = async (): Promise<News[]> => {
  const payload = await getPayload({ config });
  const newsPosts = await payload.find({
    collection: "news",
    limit: -1,
  });
  console.log("[payload:data] getNewsPostsData fetched", newsPosts.docs.length);
  return newsPosts.docs;
};

export const getNewsPostBySlugData = async (slug: string): Promise<News> => {
  const payload = await getPayload({ config });
  const newsPost = await payload.find({
    collection: "news",
    where: { slug: { equals: slug } },
  });
  return newsPost.docs[0]!;
};

export const getReviewsData = async (): Promise<Review[]> => {
  const payload = await getPayload({ config });
  const reviews = await payload.find({
    collection: "review",
    limit: -1,
  });
  console.log("[payload:data] getReviewsData fetched", reviews.docs.length);
  return reviews.docs;
};

export const getReviewBySlugData = async (slug: string): Promise<Review> => {
  const payload = await getPayload({ config });
  const review = await payload.find({
    collection: "review",
    where: { slug: { equals: slug } },
  });
  return review.docs[0]!;
};

export const getReviewByGearSlugData = async (
  gearSlug: string,
): Promise<Review> => {
  const payload = await getPayload({ config });
  const review = await payload.find({
    collection: "review",
    where: { review_gear_item: { equals: gearSlug } },
  });
  return review.docs[0]!;
};

export const getNewsByRelatedGearSlugData = async (
  gearSlug: string,
  limit: number = 12,
): Promise<News[]> => {
  const payload = await getPayload({ config });
  // Fetch all and filter locally (JSON field cannot be filtered with ILIKE)
  const all: { docs: News[] } = (await payload.find({
    collection: "news",
    limit: -1,
  })) as unknown as { docs: News[] };
  const filtered = all.docs.filter((n) => {
    const v = n.related_gear_items;
    if (!Array.isArray(v)) return false;
    return v.some((x) => typeof x === "string" && x === gearSlug);
  });
  return filtered.slice(0, limit < 0 ? filtered.length : limit);
};

export const getLearnPagesData = async (): Promise<LearnPage[]> => {
  const payload = await getPayload({ config });
  const learnPages = await payload.find({
    collection: "learn-pages",
    limit: -1,
    depth: 1,
  });
  console.log(
    "[payload:data] getLearnPagesData fetched",
    learnPages.docs.length,
  );
  return learnPages.docs;
};

export const getLearnPageBySlugData = async (
  slug: string,
): Promise<LearnPage | null> => {
  const payload = await getPayload({ config });
  const res = (await payload.find({
    collection: "learn-pages",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })) as unknown as { docs: LearnPage[] };
  return res.docs[0] ?? null;
};
