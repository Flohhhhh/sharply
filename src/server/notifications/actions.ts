"use server";
import "server-only";

import {
  archiveNotification,
  deleteNotification,
  markNotificationRead,
  createNotification,
  type CreateNotificationParams,
} from "./service";
import { getSessionOrThrow } from "~/server/auth";

export async function actionMarkNotificationRead(id: string) {
  return markNotificationRead(id);
}

export async function actionArchiveNotification(id: string) {
  return archiveNotification(id);
}

export async function actionDeleteNotification(id: string) {
  return deleteNotification(id);
}

export async function actionSendTestNotification() {
  const { user } = await getSessionOrThrow();
  const samples: Array<Omit<CreateNotificationParams, "userId">> = [
    {
      type: "gear_spec_approved",
      title: "Your spec edit was approved",
      body: "Nikon Z6III is now updated.",
      linkUrl: "/gear/nikon-z6iii",
      sourceType: "gear",
      sourceId: "nikon-z6iii",
      metadata: { gearName: "Nikon Z6III", gearSlug: "nikon-z6iii" },
    },
    {
      type: "badge_awarded",
      title: "You earned the Pioneer badge",
      body: "Early member perk unlocked.",
      linkUrl: `/u/${user.handle || `user-${user.memberNumber}`}`,
      sourceType: "badge",
      sourceId: "pioneer",
      metadata: { badgeKey: "pioneer", badgeName: "Pioneer" },
    },
  ];
  const selected = samples[Math.floor(Math.random() * samples.length)]!;

  const created = await createNotification({ userId: user.id, ...selected });
  return { ok: true, type: created.type, linkUrl: created.linkUrl };
}
