import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";

import {
  parseFileWithClientExifTool,
  resetClientExifToolWorkerForTests,
} from "../../src/app/[locale]/(pages)/(tools)/exif-viewer/parse/client-exiftool";

type WorkerMessageHandler = (event: MessageEvent<any>) => void;
type WorkerErrorHandler = (event: ErrorEvent) => void;

class MockWorker {
  static instances: MockWorker[] = [];

  private messageHandlers = new Set<WorkerMessageHandler>();
  private errorHandlers = new Set<WorkerErrorHandler>();
  public lastPostedMessage: unknown = null;

  constructor() {
    MockWorker.instances.push(this);
  }

  addEventListener(type: string, handler: WorkerMessageHandler | WorkerErrorHandler) {
    if (type === "message") {
      this.messageHandlers.add(handler as WorkerMessageHandler);
    }

    if (type === "error") {
      this.errorHandlers.add(handler as WorkerErrorHandler);
    }
  }

  removeEventListener(type: string, handler: WorkerMessageHandler | WorkerErrorHandler) {
    if (type === "message") {
      this.messageHandlers.delete(handler as WorkerMessageHandler);
    }

    if (type === "error") {
      this.errorHandlers.delete(handler as WorkerErrorHandler);
    }
  }

  postMessage(message: unknown) {
    this.lastPostedMessage = message;
  }

  terminate() {
    return undefined;
  }

  emitMessage(payload: unknown) {
    for (const handler of this.messageHandlers) {
      handler({ data: payload } as MessageEvent);
    }
  }

  emitError(message: string) {
    for (const handler of this.errorHandlers) {
      handler({ message } as ErrorEvent);
    }
  }
}

describe("client exiftool worker wrapper", () => {
  beforeEach(() => {
    MockWorker.instances = [];
    vi.stubGlobal("Worker", MockWorker);
  });

  afterEach(() => {
    resetClientExifToolWorkerForTests();
    vi.unstubAllGlobals();
  });

  it("returns normalized tag entries and warnings from the worker", async () => {
    const file = new File(["x"], "sample.nef", { type: "image/x-nikon-nef" });
    const parsePromise = parseFileWithClientExifTool(file);
    const worker = MockWorker.instances[0]!;
    const request = worker.lastPostedMessage as {
      id: number;
      type: "parse";
      file: File;
    };

    expect(request.type).toBe("parse");
    expect(request.file).toBe(file);

    worker.emitMessage({
      id: request.id,
      ok: true,
      result: {
        parser: "exiftool-wasm",
        allTags: [
          {
            key: "EXIF:Make",
            group: "EXIF",
            tag: "Make",
            value: "Nikon",
          },
        ],
        warnings: ["warning"],
      },
    });

    await expect(parsePromise).resolves.toEqual({
      parser: "exiftool-wasm",
      allTags: [
        {
          key: "EXIF:Make",
          group: "EXIF",
          tag: "Make",
          value: "Nikon",
        },
      ],
      warnings: ["warning"],
    });
  });

  it("converts worker parse failures into stable parse errors", async () => {
    const file = new File(["x"], "sample.nef", { type: "image/x-nikon-nef" });
    const parsePromise = parseFileWithClientExifTool(file);
    const worker = MockWorker.instances[0]!;
    const request = worker.lastPostedMessage as { id: number };

    worker.emitMessage({
      id: request.id,
      ok: false,
      error: "Local parse failed.",
    });

    await expect(parsePromise).rejects.toThrow("Local parse failed.");
  });

  it("rejects in-flight requests when the worker crashes", async () => {
    const file = new File(["x"], "sample.nef", { type: "image/x-nikon-nef" });
    const parsePromise = parseFileWithClientExifTool(file);
    const worker = MockWorker.instances[0]!;

    worker.emitError("Worker crashed.");

    await expect(parsePromise).rejects.toThrow("Worker crashed.");
  });
});
