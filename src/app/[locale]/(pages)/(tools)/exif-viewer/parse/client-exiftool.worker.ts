/// <reference lib="webworker" />

import { parseMetadata } from "@uswriting/exiftool";
import type { ExifViewerParseRequest } from "../types";
import {
  extractExifToolJsonTagMap,
  normalizeExifToolTagEntries,
} from "./exiftool";

type ExifToolWorkerRequest = {
  id: number;
  type: "parse";
  file: File;
};

type ExifToolWorkerResponse =
  | {
      id: number;
      ok: true;
      result: ExifViewerParseRequest["exiftool"];
    }
  | {
      id: number;
      ok: false;
      error: string;
    };

const EXIFTOOL_JSON_ARGS = ["-json", "-G1", "-a", "-s", "-u", "-sort"];
const ZEROPERL_WASM_PUBLIC_PATH = "/vendor/zeroperl.wasm";

// `@6over3/zeroperl-ts` detects browsers by checking for both `window` and
// `document`. In a web worker those globals do not exist, so it incorrectly
// falls back to the Node filesystem path under Turbopack.
if (typeof (globalThis as { window?: unknown }).window === "undefined") {
  Reflect.set(globalThis as object, "window", globalThis);
}

if (typeof (globalThis as { document?: unknown }).document === "undefined") {
  Reflect.set(globalThis as object, "document", {});
}

function exifToolFetch(...args: unknown[]) {
  const [input, init] = args as [RequestInfo | URL, RequestInit | undefined];
  const source =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  const resolvedSource =
    source === "./zeroperl.wasm" || source.endsWith("/zeroperl.wasm")
      ? new URL(ZEROPERL_WASM_PUBLIC_PATH, self.location.origin).toString()
      : source;

  return fetch(resolvedSource, init);
}

function postMessageToMainThread(message: ExifToolWorkerResponse) {
  self.postMessage(message);
}

self.addEventListener("message", (event: MessageEvent<ExifToolWorkerRequest>) => {
  void (async () => {
    if (event.data?.type !== "parse") {
      return;
    }

    try {
      const response = await parseMetadata<unknown>(event.data.file, {
        args: EXIFTOOL_JSON_ARGS,
        fetch: exifToolFetch,
        transform: (data) => JSON.parse(data) as unknown,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to parse metadata locally.");
      }

      const { rawTags, warnings } = extractExifToolJsonTagMap(response.data);
      const allTags = normalizeExifToolTagEntries(rawTags);

      postMessageToMainThread({
        id: event.data.id,
        ok: true,
        result: {
          parser: "exiftool-wasm",
          allTags,
          warnings,
        },
      });
    } catch (error) {
      postMessageToMainThread({
        id: event.data.id,
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to parse metadata locally.",
      });
    }
  })();
});

export { };
