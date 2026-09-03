import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation/sentry-server");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./instrumentation/sentry-edge");
  }
}

export const onRequestError = Sentry.captureRequestError;
