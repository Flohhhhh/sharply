import {
  getNewsPostsData,
  getReviewsData,
  getNewsPostBySlugData,
  getReviewBySlugData,
  getReviewByGearSlugData,
  getNewsByRelatedGearSlugData,
} from "./data";
import type { LearnPage, News, Review } from "~/payload-types";

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

export const getNewsByRelatedGearSlug = async (
  gearSlug: string,
  limit: number = 12,
): Promise<News[]> => {
  const list = await getNewsByRelatedGearSlugData(gearSlug, limit);
  return list.filter((p) => p._status === "published");
};

// Learn Pages
import {
  getLearnPagesData,
  getLearnPageBySlugData,
} from "./data";

export const getLearnPages = async (): Promise<LearnPage[]> => {
  const pages = await getLearnPagesData();
  const published = pages.filter((p) => p._status === "published");
  // Exclude explicitly unlisted pages from general listings (still routable by slug)
  const listed = published.filter((p) => !p.unlisted);
  // Sort newest first by createdAt
  const sorted = listed.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
  return sorted;
};

// Include unlisted pages (still published) – useful for static params generation
export const getAllPublishedLearnPages = async (): Promise<LearnPage[]> => {
  const pages = await getLearnPagesData();
  const published = pages.filter((p) => p._status === "published");
  // Keep sort for deterministic params generation
  return published.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
};

export const getLearnPageBySlug = async (
  slug: string,
): Promise<LearnPage | null> => {
  const page = await getLearnPageBySlugData(slug);
  if (!page) return null;
  if (page._status !== "published") return null;
  return page;
};
