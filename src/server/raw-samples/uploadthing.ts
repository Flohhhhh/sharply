function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
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
