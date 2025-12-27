"use server";
import "server-only";

import { requireUser } from "~/server/auth";
import {
  archiveNotification,
  deleteNotification,
  markNotificationRead,
  createNotification,
} from "./service";
import type { CreateNotificationParams } from "./data";

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
  const { user } = await requireUser();
  const samples: Array<Omit<CreateNotificationParams, "userId">> = [
    {
      type: "gear_spec_approved",
      title: "Your spec edit was approved",
      body: "Nikon Z6III is now updated.",
      linkUrl: "/gear/nikon-z6iii",
      sourceType: "gear",
      sourceId: "nikon-z6iii",
    },
    {
      type: "badge_awarded",
      title: "You earned the Pioneer badge",
      body: "Early member perk unlocked.",
      linkUrl: `/u/${user.id}`,
      sourceType: "badge",
      sourceId: "pioneer",
      metadata: { badgeKey: "pioneer" },
    },
  ];
  const selected = samples[Math.floor(Math.random() * samples.length)]!;

  const created = await createNotification({ userId: user.id, ...selected });
  return { ok: true, type: created.type, linkUrl: created.linkUrl };
}
