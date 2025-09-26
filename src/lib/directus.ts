import { createDirectus, readItems, rest } from "@directus/sdk";
import type { ApiCollections } from "@/types/directus";

const directus = createDirectus<ApiCollections>(
  "https://sharply-directus.onrender.com",
).with(rest());

export default directus;

export const getNewsPosts = async () => {
  const posts = await directus.request(
    readItems("posts", {
      fields: ["*"],
      filter: {
        post_type: {
          _eq: "news",
        },
      },
    }),
  );
  return posts;
};
export type NewsPost = Awaited<ReturnType<typeof getNewsPosts>>[number];

export const getNewsPostBySlug = async (slug: string): Promise<NewsPost> => {
  const posts = await directus.request(
    readItems("posts", {
      fields: ["*"],
      filter: { slug: { _eq: slug } },
    }),
  );
  if (posts.length === 0) {
    throw new Error(`News post with slug ${slug} not found`);
  }
  if (posts.length > 1) {
    throw new Error(`Multiple news posts with slug ${slug} found`);
  }
  console.log("getNewsPostBySlug", posts[0]);
  return posts[0]!;
};
