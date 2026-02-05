import "server-only";

import {
  CONTACT_MIN_SUBMIT_MS,
  type ContactFormInput,
  type ContactSubmissionResult,
} from "~/lib/contact/contact-schema";
import { sendContactEmail } from "./email";

type ContactSubmitMeta = {
  honeypot?: string | null;
  startedAt?: number | null;
  route: string;
};

export async function submitContactMessage(
  input: ContactFormInput,
  meta: ContactSubmitMeta,
): Promise<ContactSubmissionResult> {
  if (meta.honeypot && meta.honeypot.trim().length > 0) {
    return {
      ok: false,
      message: "Unable to send message. Please try again later.",
    };
  }

  if (typeof meta.startedAt === "number") {
    const elapsed = Date.now() - meta.startedAt;
    if (elapsed >= 0 && elapsed < CONTACT_MIN_SUBMIT_MS) {
      return {
        ok: false,
        message: "Please take a moment before submitting the form.",
      };
    }
  }

  const timestamp = new Date().toISOString();
  const result = await sendContactEmail({
    ...input,
    route: meta.route,
    timestamp,
  });

  if (!result.ok) {
    return {
      ok: false,
      message: "Unable to send message. Please try again later.",
    };
  }

  return { ok: true };
}
