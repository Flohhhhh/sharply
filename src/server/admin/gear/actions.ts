"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { createGearAdmin } from "./service";
import type { GearCreationParams } from "./data";

export async function actionCreateGear(params: GearCreationParams) {
  const result = await createGearAdmin(params);
  revalidatePath("/admin");
  return result;
}
