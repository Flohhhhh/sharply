import type { ExifViewerParseRequest } from "../types";

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

type PendingWorkerRequest = {
  resolve: (value: ExifViewerParseRequest["exiftool"]) => void;
  reject: (reason?: unknown) => void;
};

let workerInstance: Worker | null = null;
let workerRequestId = 0;
const pendingRequests = new Map<number, PendingWorkerRequest>();

function rejectPendingRequests(error: Error) {
  for (const pending of pendingRequests.values()) {
    pending.reject(error);
  }

  pendingRequests.clear();
}

function resetWorkerInstance() {
  workerInstance?.terminate();
  workerInstance = null;
}

function createWorker() {
  const worker = new Worker(
    new URL("./client-exiftool.worker.ts", import.meta.url),
    { type: "module" },
  );

  worker.addEventListener("message", (event: MessageEvent<ExifToolWorkerResponse>) => {
    const pending = pendingRequests.get(event.data.id);
    if (!pending) {
      return;
    }

    pendingRequests.delete(event.data.id);

    if (event.data.ok) {
      pending.resolve(event.data.result);
      return;
    }

    pending.reject(
      new Error(event.data.error || "Failed to parse metadata locally."),
    );
  });

  worker.addEventListener("error", (event) => {
    rejectPendingRequests(
      new Error(event.message || "The local EXIF parser crashed."),
    );
    resetWorkerInstance();
  });

  return worker;
}

function getWorker() {
  if (!workerInstance) {
    workerInstance = createWorker();
  }

  return workerInstance;
}

export function resetClientExifToolWorkerForTests() {
  rejectPendingRequests(new Error("Client EXIF parser reset."));
  resetWorkerInstance();
  workerRequestId = 0;
}

export function parseFileWithClientExifTool(
  file: File,
): Promise<ExifViewerParseRequest["exiftool"]> {
  return new Promise((resolve, reject) => {
    const requestId = workerRequestId + 1;
    workerRequestId = requestId;

    pendingRequests.set(requestId, {
      resolve,
      reject,
    });

    const worker = getWorker();
    const request: ExifToolWorkerRequest = {
      id: requestId,
      type: "parse",
      file,
    };

    worker.postMessage(request);
  });
}
