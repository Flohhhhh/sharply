import { Resend } from "resend";

let resendClient: Resend | null | undefined;

export function getResend() {
  if (resendClient !== undefined) {
    return resendClient;
  }

  resendClient =
    process.env.RESEND_API_KEY && process.env.RESEND_EMAIL_FROM
      ? new Resend(process.env.RESEND_API_KEY)
      : null;

  return resendClient;
}
