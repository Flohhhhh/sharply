import {
  getNewsPostsData,
  getReviewsData,
  getNewsPostBySlugData,
  getReviewBySlugData,
  getReviewByGearSlugData,
} from "./data";
import type { News, Review } from "~/payload-types";

export const getNewsPosts = async (): Promise<News[]> => {
  const posts = await getNewsPostsData();
  const published = posts.filter((p) => p._status === "published");
  // sort by override date if it exists, otherwise sort by creation date
  const sorted = published.sort((a, b) => {
    const aTime = a.override_date
      ? new Date(a.override_date).getTime()
      : new Date(a.createdAt).getTime();
    const bTime = b.override_date
      ? new Date(b.override_date).getTime()
      : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
  return sorted;
};

export const getNewsPostBySlug = async (slug: string): Promise<News> => {
  const newsPost = await getNewsPostBySlugData(slug);
  if (newsPost._status !== "published") {
    throw new Error("News post is not published");
  }
  return newsPost;
};

export const getReviews = async (): Promise<Review[]> => {
  const reviews = await getReviewsData();
  const published = reviews.filter((r) => r._status === "published");
  // sort by creation date only (no override for reviews)
  const sorted = published.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
  return sorted;
};

export const getReviewBySlug = async (slug: string): Promise<Review | null> => {
  const review = await getReviewBySlugData(slug);
  if (review._status !== "published") {
    return null;
  }
  return review;
};

export const getReviewByGearSlug = async (
  gearSlug: string,
): Promise<Review | null> => {
  const review = await getReviewByGearSlugData(gearSlug);
  if (!review) {
    return null;
  }
  if (review._status !== "published") {
    return null;
  }
  return review;
};
