import { z } from "zod";

export const YOUTUBE_PLATFORM = "YOUTUBE" as const;

const youTubeVideoIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{11}$/, "Invalid YouTube video ID");

export type CreatorVideoPlatform = typeof YOUTUBE_PLATFORM;

export type CreatorVideoMetadataResolution = {
  platform: CreatorVideoPlatform;
  sourceUrl: string;
  normalizedUrl: string;
  embedUrl: string;
  externalVideoId: string;
  title: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  metadataStatus: "resolved" | "manual_required";
  message: string | null;
};

function coerceUrlInput(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("A video URL is required");
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function extractVideoIdFromUrl(url: URL) {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/\/+$/, "");

  if (host === "youtu.be") {
    const candidate = path.split("/").find(Boolean);
    return candidate ?? null;
  }

  if (
    host === "youtube.com" ||
    host === "www.youtube.com" ||
    host === "m.youtube.com"
  ) {
    if (path === "/watch") {
      return url.searchParams.get("v");
    }

    const parts = path.split("/").filter(Boolean);
    const [first, second] = parts;

    if (!first) {
      return null;
    }

    if (first === "shorts" || first === "embed") {
      return second ?? null;
    }

    if (
      first === "playlist" ||
      first === "channel" ||
      first === "c" ||
      first === "user" ||
      first.startsWith("@")
    ) {
      return null;
    }
  }

  return null;
}

export function normalizeYouTubeVideoUrl(input: string) {
  let url: URL;
  try {
    url = new URL(coerceUrlInput(input));
  } catch {
    throw new Error("Enter a valid YouTube video URL");
  }

  const videoId = extractVideoIdFromUrl(url);
  const parsedVideoId = youTubeVideoIdSchema.safeParse(videoId);
  if (!parsedVideoId.success) {
    throw new Error("Only individual YouTube video URLs are supported");
  }

  return {
    platform: YOUTUBE_PLATFORM,
    sourceUrl: input.trim(),
    normalizedUrl: `https://www.youtube.com/watch?v=${parsedVideoId.data}`,
    embedUrl: `https://www.youtube.com/embed/${parsedVideoId.data}`,
    externalVideoId: parsedVideoId.data,
  };
}

function buildDerivedYouTubeThumbnail(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

type YouTubeOEmbedPayload = {
  title?: string;
  thumbnail_url?: string;
};

async function fetchYouTubeOEmbed(normalizedUrl: string) {
  const endpoint = new URL("https://www.youtube.com/oembed");
  endpoint.searchParams.set("url", normalizedUrl);
  endpoint.searchParams.set("format", "json");

  const controller = new AbortController();
  const timeoutMs = 5_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Metadata lookup timed out after ${timeoutMs}ms`, {
        cause: error,
      });
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Metadata lookup failed with status ${response.status}`);
  }

  const payload = (await response.json()) as YouTubeOEmbedPayload;
  if (!payload.title?.trim()) {
    throw new Error("Metadata lookup did not return a title");
  }

  return {
    title: payload.title.trim(),
    thumbnailUrl: payload.thumbnail_url?.trim() || null,
  };
}

export async function resolveCreatorVideoMetadata(
  input: string,
): Promise<CreatorVideoMetadataResolution> {
  const normalized = normalizeYouTubeVideoUrl(input);

  try {
    const metadata = await fetchYouTubeOEmbed(normalized.normalizedUrl);
    return {
      ...normalized,
      title: metadata.title,
      thumbnailUrl:
        metadata.thumbnailUrl ??
        buildDerivedYouTubeThumbnail(normalized.externalVideoId),
      publishedAt: null,
      metadataStatus: "resolved",
      message: null,
    };
  } catch {
    return {
      ...normalized,
      title: null,
      thumbnailUrl: buildDerivedYouTubeThumbnail(normalized.externalVideoId),
      publishedAt: null,
      metadataStatus: "manual_required",
      message:
        "Automatic title lookup failed. Enter the title manually to continue.",
    };
  }
}
