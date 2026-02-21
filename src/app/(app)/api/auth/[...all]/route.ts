import { auth } from "~/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);

export async function GET(request: Request, context: unknown) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const shouldLog =
    pathname.includes("/sign-in/social") || pathname.includes("/callback/");

  if (shouldLog) {
    console.info("[auth-callback-debug] auth_route_get", {
      method: "GET",
      requestUrl: request.url,
      host: request.headers.get("host"),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      xForwardedHost: request.headers.get("x-forwarded-host"),
      xForwardedProto: request.headers.get("x-forwarded-proto"),
    });
  }

  return handlers.GET(request, context as any);
}

export async function POST(request: Request, context: unknown) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const shouldLog =
    pathname.includes("/sign-in/social") || pathname.includes("/callback/");

  if (shouldLog) {
    console.info("[auth-callback-debug] auth_route_post", {
      method: "POST",
      requestUrl: request.url,
      host: request.headers.get("host"),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      xForwardedHost: request.headers.get("x-forwarded-host"),
      xForwardedProto: request.headers.get("x-forwarded-proto"),
    });
  }

  return handlers.POST(request, context as any);
}
