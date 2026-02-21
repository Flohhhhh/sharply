const ABSOLUTE_URL_PATTERN = /^[a-z][a-z0-9+\-.]*:\/\//i;

type CallbackUrlOptions = {
  baseOrigin?: string;
  debugLabel?: string;
};

function safeOrigin(value?: string) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function debugLog(label: string, payload: Record<string, unknown>) {
  console.info(`[auth-callback-debug] ${label}`, payload);
}

export function getAuthCallbackUrlForOrigin(
  callbackUrl: string,
  currentOrigin: string,
  options?: CallbackUrlOptions,
) {
  const current = safeOrigin(currentOrigin) ?? currentOrigin;
  const configuredBase = safeOrigin(options?.baseOrigin);

  try {
    if (ABSOLUTE_URL_PATTERN.test(callbackUrl)) {
      const parsed = new URL(callbackUrl);
      const shouldRewriteToCurrentOrigin =
        !!configuredBase &&
        parsed.origin === configuredBase &&
        parsed.origin !== current;

      if (shouldRewriteToCurrentOrigin) {
        const rewritten = new URL(
          `${parsed.pathname}${parsed.search}${parsed.hash}`,
          current,
        ).toString();
        debugLog("absolute_rewrite", {
          label: options?.debugLabel ?? "unknown",
          callbackUrl,
          currentOrigin: current,
          baseOrigin: configuredBase,
          rewritten,
        });
        return rewritten;
      }

      return parsed.toString();
    }

    const resolved = new URL(callbackUrl, current).toString();
    debugLog("relative_resolve", {
      label: options?.debugLabel ?? "unknown",
      callbackUrl,
      currentOrigin: current,
      resolved,
    });
    return resolved;
  } catch (error) {
    const fallback = new URL("/", current).toString();
    debugLog("resolution_failed", {
      label: options?.debugLabel ?? "unknown",
      callbackUrl,
      currentOrigin: current,
      fallback,
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback;
  }
}
