import type { CollectionConfig } from "payload";

export const canManageMedia = ({
  req: { user },
}: {
  req: { user: { role?: string | null } | null };
}) =>
  user?.role === "editor" ||
  user?.role === "admin" ||
  user?.role === "superadmin";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
    delete: ({ req: { user } }) =>
      user?.role === "superadmin" || user?.role === "admin",
    create: canManageMedia,
    update: canManageMedia,
  },
  fields: [
    {
      // Deprecated UploadThing identifier retained for migration and rollback.
      name: "_key",
      type: "text",
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        disableBulkEdit: true,
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
    },
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
  upload: {
    disableLocalStorage: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
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
