import { timingSafeEqual } from "node:crypto";

export function getDiscordBotInternalAuthError(request: Request): {
  status: number;
  message: string;
} | null {
  const expectedToken = process.env.DISCORD_BOT_INTERNAL_API_TOKEN?.trim();
  if (!expectedToken) {
    return {
      status: 503,
      message: "Discord bot internal API token is not configured.",
    };
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return {
      status: 401,
      message: "Missing bearer token.",
    };
  }

  const providedToken = authorization.slice("Bearer ".length).trim();
  const providedBuffer = Buffer.from(providedToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return {
      status: 401,
      message: "Invalid bearer token.",
    };
  }

  return null;
}
