import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: true,
  access: {
    create: ({ req: { user } }) => user?.role === "superadmin",
    read: ({ req: { user } }) =>
      user?.role === "superadmin" || user?.role === "admin",
    update: ({ req: { user } }) =>
      user?.role === "superadmin" || user?.role === "admin",
    delete: ({ req: { user } }) => user?.role === "superadmin",
  },
  fields: [
    {
      name: "role",
      type: "select",
      access: {
        create: ({ req: { user } }) => user?.role === "superadmin",
        update: ({ req: { user } }) => user?.role === "superadmin",
      },
      options: [
        {
          label: "Super Admin",
          value: "superadmin",
        },
        {
          label: "Admin",
          value: "admin",
        },
        {
          label: "User",
          value: "editor",
        },
      ],
    },
    {
      name: "displayName",
      type: "text",
      access: {
        create: ({ req: { user } }) =>
          user?.role === "superadmin" ||
          user?.role === "admin" ||
          user?.role === "editor",
        update: ({ req: { user } }) =>
          user?.role === "superadmin" ||
          user?.role === "admin" ||
          user?.role === "editor",
      },
      admin: {
        description: "The display name of the user.",
      },
    },
  ],
};
