import type { AuthContext, GenericEndpointContext } from "@better-auth/core";
import { runWithAdapter, runWithEndpointContext } from "@better-auth/core/context";
import { setSessionCookie } from "better-auth/cookies";
import { createEndpoint } from "better-call";
import type { NextRequest } from "next/server";

import { auth } from "~/auth";
import {
  getOrCreateDevelopmentAuthUser,
  isDevelopmentAuthEnabled,
} from "~/server/auth/dev-auth/service";

type DevelopmentAuthContext = Awaited<typeof auth.$context>;
type DevelopmentAuthEndpointContext = GenericEndpointContext & {
  context: DevelopmentAuthContext;
  request: Request;
  headers: Headers;
};

const developmentLoginEndpoint = createEndpoint(
  "/api/dev-login",
  {
    method: "GET",
    requireHeaders: true,
    requireRequest: true,
  },
  async (ctx) => {
    const developmentContext = ctx as DevelopmentAuthEndpointContext;

    return runWithEndpointContext(developmentContext, async () => {
      // This route is intentionally fail-closed: even if DEV_AUTH is configured
      // in a public deployment, production code paths still refuse to run it.
      if (!isDevelopmentAuthEnabled()) {
        throw ctx.error(404, { message: "Not found" });
      }

      const existingSession = await auth.api.getSession({
        headers: developmentContext.headers,
      });

      if (existingSession) {
        throw ctx.redirect(new URL("/", developmentContext.request.url).toString());
      }

      const user = await getOrCreateDevelopmentAuthUser();
      const session = await developmentContext.context.internalAdapter.createSession(
        user.id,
      );

      await setSessionCookie(developmentContext, {
        session,
        user,
      });

      throw ctx.redirect(new URL("/", developmentContext.request.url).toString());
    });
  },
);

export async function GET(request: NextRequest) {
  if (!isDevelopmentAuthEnabled()) {
    return new Response("Not found", { status: 404 });
  }

  const context = (await auth.$context) as DevelopmentAuthContext;

  return runWithAdapter(context.adapter, () =>
    developmentLoginEndpoint({
      request,
      headers: request.headers,
      asResponse: true,
      context,
    } as {
      request: Request;
      headers: Headers;
      asResponse: true;
      context: AuthContext;
    }),
  );
}
