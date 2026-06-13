export interface ResolveRequestImageButtonStateInput {
  initialHasRequested: boolean | null;
  hydratedHasRequested?: boolean | null;
  hasHydrationError: boolean;
  optimisticHasRequested: boolean | null;
}

export interface RequestImageButtonRenderState {
  hasRequested: boolean;
  shouldRender: boolean;
  shouldShowHelper: boolean;
}

export function resolveRequestImageButtonState({
  initialHasRequested,
  hydratedHasRequested,
  hasHydrationError,
  optimisticHasRequested,
}: ResolveRequestImageButtonStateInput): RequestImageButtonRenderState {
  const resolvedHasRequested =
    optimisticHasRequested ??
    initialHasRequested ??
    (typeof hydratedHasRequested === "boolean" ? hydratedHasRequested : null);

  if (typeof resolvedHasRequested !== "boolean") {
    return {
      hasRequested: false,
      shouldRender: false,
      shouldShowHelper: false,
    };
  }

  if (
    initialHasRequested === null &&
    optimisticHasRequested === null &&
    typeof hydratedHasRequested !== "boolean"
  ) {
    return {
      hasRequested: false,
      shouldRender: false,
      shouldShowHelper: false,
    };
  }

  if (initialHasRequested === null && hasHydrationError) {
    return {
      hasRequested: false,
      shouldRender: false,
      shouldShowHelper: false,
    };
  }

  return {
    hasRequested: resolvedHasRequested,
    shouldRender: true,
    shouldShowHelper: !resolvedHasRequested,
  };
}
