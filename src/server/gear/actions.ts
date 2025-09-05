"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import {
  submitReview,
  submitGearEditProposal,
  toggleOwnership,
  toggleWishlist,
} from "./service";

/** Server actions for UI components */

export async function actionToggleWishlist(
  slug: string,
  action: "add" | "remove",
) {
  const res = await toggleWishlist(slug, action);
  // Revalidate gear page and stats card
  revalidatePath(`/gear/${slug}`);
  return res;
}

export async function actionToggleOwnership(
  slug: string,
  action: "add" | "remove",
) {
  const res = await toggleOwnership(slug, action);
  revalidatePath(`/gear/${slug}`);
  return res;
}

export async function actionSubmitReview(slug: string, body: unknown) {
  const res = await submitReview(slug, body);
  revalidatePath(`/gear/${slug}`);
  return res;
}

export async function actionSubmitGearProposal(body: unknown) {
  const res = await submitGearEditProposal(body);
  // Revalidate pages that surface proposal counts if any in the future
  return res;
}
