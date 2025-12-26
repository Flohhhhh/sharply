"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "~/server/auth";
import {
  SupportedProvider,
  unlinkProviderAccount,
} from "./account-linking";

const providerSchema = z.enum(["discord", "google"]);

type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function actionUnlinkProvider(
  rawProvider: unknown,
): Promise<ActionResult> {
  const parseResult = providerSchema.safeParse(rawProvider);
  if (!parseResult.success) {
    return { ok: false, error: "Invalid provider" };
  }

  const provider = parseResult.data as SupportedProvider;
  const { user } = await requireUser();

  await unlinkProviderAccount(user.id, provider);
  revalidatePath("/profile/settings");

  return { ok: true };
}

