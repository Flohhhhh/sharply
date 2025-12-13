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
    afterChange: [
      async ({ collection, context, doc, req }) => {
        if (!context.updatePerformed) {
          context.updatePerformed = true; // if this isn't first, the UI hangs?
          console.log("doc", doc);
          // console.log("req", req);
          await req.payload.update({
            req,
            collection: collection.slug,
            data: {
              url: doc.url,
            },
            where: {
              id: { equals: doc.id },
            },
          });
        }
      },
    ],
  },
};
