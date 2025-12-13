import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
    delete: ({ req: { user } }) =>
      user?.role === "superadmin" || user?.role === "admin",
    create: () => true, // anyone can create media
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
  upload: {
    disableLocalStorage: true,
    mimeTypes: ["image/*"],
    staticDir: "media",
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        console.log("doc", doc);
      },
    ],
  },
};
