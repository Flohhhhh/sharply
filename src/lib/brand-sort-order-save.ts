export type BrandSortSaveCompletionResult =
  | { kind: "commit" }
  | { kind: "requeue" }
  | { kind: "stale" };

export function resolveBrandSortSaveCompletion(params: {
  responseRequestId: number;
  latestRequestId: number;
  queuedSignature: string | null;
}): BrandSortSaveCompletionResult {
  if (params.responseRequestId !== params.latestRequestId) {
    return { kind: "stale" };
  }

  if (params.queuedSignature) {
    return { kind: "requeue" };
  }

  return { kind: "commit" };
}
