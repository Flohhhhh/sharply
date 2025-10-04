import {
  getNewsPostsData,
  getReviewsData,
  getNewsPostBySlugData,
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

export const getReviews = async (): Promise<Review[]> => {
  return getReviewsData();
};

export const getNewsPostBySlug = async (slug: string): Promise<News> => {
  return getNewsPostBySlugData(slug);
};
