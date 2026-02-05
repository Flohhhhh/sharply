import "server-only";

import { env } from "~/env";
import { resend } from "~/lib/email";
import {
  contactReasonLabels,
  type ContactFormInput,
} from "~/lib/contact/contact-schema";

type ContactEmailPayload = ContactFormInput & {
  route: string;
  timestamp: string;
};

export async function sendContactEmail(payload: ContactEmailPayload) {
  if (!resend || !env.RESEND_EMAIL_FROM || !env.RESEND_EMAIL_CONTACT) {
    return {
      ok: false,
      error: "Contact email is not configured.",
    } as const;
  }

  const subject = `[Sharply Contact] ${contactReasonLabels[payload.reason]}: ${payload.subject}`;
  const replyTo = payload.email;
  const lines = [
    `Reason: ${contactReasonLabels[payload.reason]}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Subject: ${payload.subject}`,
  ];

  if (payload.referenceUrl) {
    lines.push(`Reference URL: ${payload.referenceUrl}`);
  }

  if (payload.company) {
    lines.push(`Company: ${payload.company}`);
  }

  lines.push(
    "",
    "Message:",
    payload.message,
    "",
    `Route: ${payload.route}`,
    `Timestamp: ${payload.timestamp}`,
  );

  console.log("Sending email with replyTo:", replyTo);

  try {
    await resend.emails.send({
      from: env.RESEND_EMAIL_FROM,
      to: env.RESEND_EMAIL_CONTACT,
      replyTo,
      subject,
      text: lines.join("\n"),
    });
    return { ok: true } as const;
  } catch (error) {
    console.error("[contact] Failed to send email", error);
    return {
      ok: false,
      error: "Failed to send contact email.",
    } as const;
  }
}
