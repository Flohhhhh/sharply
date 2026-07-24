export function getPageLoadingState<T>(
  pages: readonly (T | null | undefined)[],
  requestedPage: number,
  isValidating: boolean,
  hasError = false,
) {
  return {
    isLoadingInitial: !pages[0] && !hasError,
    isLoadingMore:
      requestedPage > 1 && isValidating && !pages[requestedPage - 1],
  };
}
