import "server-only";

import {
  notifyUserSignup,
  type UserSignupProvider,
} from "./general";

type AuthHookContext = {
  params?: { id?: unknown };
  context?: {
    runInBackground?: (task: Promise<unknown>) => void;
  };
} | null;

type DispatchUserSignupNotificationParams = {
  authContext: AuthHookContext;
  name: string | null | undefined;
};

type DispatchDeps = {
  notify?: typeof notifyUserSignup;
};

export function resolveUserSignupProvider(
  providerId: unknown,
): UserSignupProvider {
  if (providerId === "google") return "Google";
  if (providerId === "discord") return "Discord";
  return "Unknown";
}

/**
 * Adapts Better Auth's user-create hook to the general Discord log without
 * awaiting the network request in the signup transaction.
 */
export function dispatchUserSignupNotification(
  { authContext, name }: DispatchUserSignupNotificationParams,
  deps?: DispatchDeps,
) {
  const notification = (deps?.notify ?? notifyUserSignup)({
    name,
    provider: resolveUserSignupProvider(authContext?.params?.id),
  });

  const runInBackground = authContext?.context?.runInBackground;
  if (runInBackground) {
    runInBackground(notification);
  } else {
    void notification;
  }
}
