const ABSOLUTE_URL_PATTERN = /^[a-z][a-z0-9+\-.]*:\/\//i;

export function getAuthCallbackUrlForOrigin(
  callbackUrl: string,
  currentOrigin: string,
) {
  if (ABSOLUTE_URL_PATTERN.test(callbackUrl)) {
    return callbackUrl;
  }

  return new URL(callbackUrl, currentOrigin).toString();
}
