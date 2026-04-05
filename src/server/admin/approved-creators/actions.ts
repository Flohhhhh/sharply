"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import {
  createApprovedCreatorAdmin,
  fetchGearSlugsByCreatorId,
  setApprovedCreatorActiveAdmin,
  updateApprovedCreatorAdmin,
} from "./service";

async function revalidateCreatorPages(creatorId: string) {
  const slugs = await fetchGearSlugsByCreatorId(creatorId);
  for (const { slug } of slugs) {
    revalidatePath(`/gear/${slug}`);
  }
}

export async function actionCreateApprovedCreator(input: unknown) {
  const creator = await createApprovedCreatorAdmin(input);
  revalidatePath("/admin/approved-creators");
  return creator;
}

export async function actionUpdateApprovedCreator(
  id: string,
  input: unknown,
) {
  const creator = await updateApprovedCreatorAdmin(id, input);
  revalidatePath("/admin/approved-creators");
  await revalidateCreatorPages(id);
  return creator;
}

export async function actionSetApprovedCreatorActive(
  id: string,
  isActive: boolean,
) {
  const creator = await setApprovedCreatorActiveAdmin({ id, isActive });
  revalidatePath("/admin/approved-creators");
  await revalidateCreatorPages(id);
  return creator;
}
