"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { createGearAdmin, renameGearService } from "./service";
import type { GearCreationParams } from "./data";

export async function actionCreateGear(params: GearCreationParams) {
  const result = await createGearAdmin(params);
  revalidatePath("/admin");
  return result;
}

export async function actionRenameGear(params: {
  gearId: string;
  newName: string;
}) {
  const result = await renameGearService(params);
  // Revalidate both old and new paths
  revalidatePath("/admin/gear");
  revalidatePath(`/gear/${result.slug}`);
  return result;
}
