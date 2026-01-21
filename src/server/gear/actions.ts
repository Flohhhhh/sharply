"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import {
  submitReview,
  submitGearEditProposal,
  toggleOwnership,
  toggleWishlist,
  toggleImageRequest,
  upsertStaffVerdict,
  updateGearAlternatives,
  addRawSampleToGear,
  removeRawSampleFromGear,
  type RawSamplePayload,
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

export async function actionToggleImageRequest(
  slug: string,
  action: "add" | "remove",
) {
  const res = await toggleImageRequest(slug, action);
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
  if (res?.autoApproved) {
    const slug =
      body && typeof body === "object" && body !== null && "slug" in body
        ? (body as { slug?: string }).slug
        : undefined;
    if (slug) {
      revalidatePath(`/gear/${slug}`);
    }
  }
  // Revalidate pages that surface proposal counts if any in the future
  return res;
}

export async function actionUpsertStaffVerdict(slug: string, body: unknown) {
  const res = await upsertStaffVerdict(slug, body);
  revalidatePath(`/gear/${slug}`);
  return res;
}

export async function actionUpdateGearAlternatives(
  slug: string,
  alternatives: Array<{ gearId: string; isCompetitor: boolean }>,
) {
  const res = await updateGearAlternatives(slug, { alternatives });
  revalidatePath(`/gear/${slug}`);
  return res;
}

export async function actionAddGearRawSample(
  slug: string,
  payload: RawSamplePayload,
) {
  const result = await addRawSampleToGear(slug, payload);
  revalidatePath(`/gear/${slug}`);
  return result;
}

export async function actionRemoveGearRawSample(slug: string, sampleId: string) {
  const result = await removeRawSampleFromGear(slug, sampleId);
  revalidatePath(`/gear/${slug}`);
  return result;
}
