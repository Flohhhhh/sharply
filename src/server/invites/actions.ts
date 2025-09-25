"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createInvite } from "./service";

const createInviteSchema = z.object({
  inviteeName: z.string().trim().min(2).max(100),
  role: z.enum(["USER", "EDITOR", "ADMIN"]),
});

export async function actionCreateInvite(formData: FormData): Promise<void> {
  const inviteeName = String(formData.get("inviteeName") ?? "");
  const role = String(formData.get("role") ?? "USER");
  console.info("[invites] actionCreateInvite:start", { inviteeName, role });
  const parsed = createInviteSchema.safeParse({ inviteeName, role });
  if (!parsed.success) {
    console.info(
      "[invites] actionCreateInvite:validation_error",
      parsed.error.flatten(),
    );
    return;
  }
  const invite = await createInvite(parsed.data);
  console.info("[invites] actionCreateInvite:success", { inviteId: invite.id });
  revalidatePath("/admin/private");
}
