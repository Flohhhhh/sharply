import type { DBFieldAttribute } from "@better-auth/core/db";
import { avatarSourceValues } from "~/lib/auth/avatar";

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
    preferredBrandId: {
      type: "string",
      required: false,
      defaultValue: null,
    },
    preferredMountId: {
      type: "string",
      required: false,
      defaultValue: null,
    },
    developerAccessEnabled: {
      type: "boolean",
      required: false,
      defaultValue: false,
    },
    discordImage: {
      type: "string",
      required: false,
      defaultValue: null,
      input: false,
    },
    avatarSource: {
      type: [...avatarSourceValues],
      required: false,
      defaultValue: null,
      input: false,
    },
  },
} satisfies {
  user: Record<string, DBFieldAttribute>;
};
