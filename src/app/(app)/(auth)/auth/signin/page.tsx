import type { Metadata } from "next";
import { env } from "~/env";
import SignInClient from "./client";

export const metadata: Metadata = {
  title: "Log In",
  openGraph: {
    title: "Log In",
  },
};

export default function Page() {
  const providerAvailability = {
    google: {
      enabled: !!env.AUTH_GOOGLE_ID && !!env.AUTH_GOOGLE_SECRET,
      missing: [
        ...(env.AUTH_GOOGLE_ID ? [] : ["AUTH_GOOGLE_ID"]),
        ...(env.AUTH_GOOGLE_SECRET ? [] : ["AUTH_GOOGLE_SECRET"]),
      ],
    },
    discord: {
      enabled: !!env.AUTH_DISCORD_ID && !!env.AUTH_DISCORD_SECRET,
      missing: [
        ...(env.AUTH_DISCORD_ID ? [] : ["AUTH_DISCORD_ID"]),
        ...(env.AUTH_DISCORD_SECRET ? [] : ["AUTH_DISCORD_SECRET"]),
      ],
    },
  };

  const emailOtpAvailability = {
    enabled: !!env.RESEND_API_KEY && !!env.RESEND_EMAIL_FROM,
    missing: [
      ...(env.RESEND_API_KEY ? [] : ["RESEND_API_KEY"]),
      ...(env.RESEND_EMAIL_FROM ? [] : ["RESEND_EMAIL_FROM"]),
    ],
  };

  return (
    <SignInClient
      providerAvailability={providerAvailability}
      emailOtpAvailability={emailOtpAvailability}
    />
  );
}
