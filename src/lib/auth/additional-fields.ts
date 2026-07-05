import type { DBFieldAttribute } from "@better-auth/core/db";

export const userRoleValues = [
  "USER",
  "MODERATOR",
  "EDITOR",
  "ADMIN",
  "SUPERADMIN",
] as const;

export type UserRole = (typeof userRoleValues)[number];
const userRoleFieldType: UserRole[] = [...userRoleValues];

export const authAdditionalFields = {
  user: {
    handle: {
      type: "string",
      required: false,
    },
    role: {
      type: userRoleFieldType,
      required: true,
      defaultValue: "USER",
    },
    memberNumber: {
      type: "number",
      required: false,
    },
    inviteId: {
      type: "string",
      required: false,
      defaultValue: null,
    },
    socialLinks: {
      type: "json",
      required: false,
      defaultValue: [],
    },
  },
} satisfies {
  user: Record<string, DBFieldAttribute>;
};
