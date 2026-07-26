function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function isUploadThingHost(hostname: string) {
  return (
    hostname === "utfs.io" ||
    hostname.endsWith(".utfs.io") ||
    hostname === "ufs.sh" ||
    hostname.endsWith(".ufs.sh")
  );
}

export function extractUploadThingFileKey(fileUrl: string): string | null {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(fileUrl);
  } catch {
    return null;
  }

  const segments = parsedUrl.pathname
    .split("/")
    .filter(Boolean)
    .map(safeDecode);

  const directFileIndex = segments.indexOf("f");
  if (directFileIndex >= 0) {
    const fileKey = segments.slice(directFileIndex + 1).join("/");
    return fileKey || null;
  }

  const appScopedIndex = segments.indexOf("a");
  if (appScopedIndex >= 0) {
    const fileKey = segments.slice(appScopedIndex + 2).join("/");
    return fileKey || null;
  }

  return null;
}

/** Returns true only for UploadThing delivery URLs with a usable file key. */
export function isUploadThingFileUrl(fileUrl: string): boolean {
  try {
    const parsedUrl = new URL(fileUrl);
    return isUploadThingHost(parsedUrl.hostname) && Boolean(extractUploadThingFileKey(fileUrl));
  } catch {
    return false;
  }
}
