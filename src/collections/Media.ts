import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
    delete: ({ req: { user } }) =>
      user?.role === "superadmin" || user?.role === "admin",
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
    staticDir: "https://",
  },
  hooks: {
    beforeChange: [
      ({ req, data }) => {
        console.log(req);
        console.log(data);
      },
    ],
    afterChange: [
      ({ doc }) => {
        console.log(doc);
      },
    ],
  },
};
