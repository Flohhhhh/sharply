import "server-only";
import { getPayload } from "payload";
import config from "~/payload.config";
import type { News, Review } from "~/payload-types";

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
