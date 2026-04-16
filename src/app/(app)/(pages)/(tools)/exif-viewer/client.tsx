"use client";

import { useRef, useState } from "react";
import {
  EXIF_VIEWER_ALLOWED_EXTENSIONS,
  EXIF_VIEWER_MAX_FILE_BYTES,
  type ExifViewerResponse,
} from "./types";

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function ExifViewerClient() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ExifViewerResponse | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  async function parseFile(file: File) {
    setIsParsing(true);
    setActiveFileName(file.name);
    setRequestError(null);
    setResult(null);

    const formData = new FormData();
    formData.set("file", file);

    try {
      const response = await fetch("/exif-viewer/parse", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ExifViewerResponse;
      setResult(payload);
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "Request failed.",
      );
    } finally {
      setIsParsing(false);
    }
  }

  function handleSelectedFile(file: File | null) {
    if (!file) return;
    void parseFile(file);
  }

  return (
    <div className="mx-auto mt-20 max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Camera Shutter Count Tool</h1>
        <p className="text-muted-foreground text-sm">
          Upload a JPG or supported RAW file and inspect the maker-note metadata
          path used to find shutter count.
        </p>
      </div>

      <div className="space-y-3 border p-4">
        <input
          ref={inputRef}
          type="file"
          accept={EXIF_VIEWER_ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(",")}
          className="block w-full text-sm"
          onChange={(event) =>
            handleSelectedFile(event.currentTarget.files?.[0] ?? null)
          }
        />
        <div
          className={`border px-4 py-8 text-sm ${
            isDragging ? "border-foreground bg-muted/40" : "border-dashed"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleSelectedFile(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <p>Drop a file here or use the file picker above.</p>
          <p className="text-muted-foreground mt-2 text-xs">
            Supported: {EXIF_VIEWER_ALLOWED_EXTENSIONS.join(", ")}. Max file
            size: {Math.round(EXIF_VIEWER_MAX_FILE_BYTES / 1024 / 1024)}MB.
          </p>
          <button
            type="button"
            className="mt-4 border px-3 py-2 text-sm"
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </button>
        </div>
      </div>

      <div className="border p-4 text-sm">
        {isParsing ? (
          <p>Parsing {activeFileName ?? "file"}...</p>
        ) : result ? (
          <p>
            Status: <strong>{result.status}</strong> - {result.message}
          </p>
        ) : requestError ? (
          <p className="text-red-600">{requestError}</p>
        ) : (
          <p>No file parsed yet.</p>
        )}
      </div>

      {result ? (
        <>
          <section className="space-y-3 border p-4 text-sm">
            <h2 className="text-lg font-semibold">Result</h2>
            <dl className="grid gap-2 md:grid-cols-2">
              <div>
                <dt className="font-medium">File</dt>
                <dd>
                  {result.file.name} ({formatFileSize(result.file.size)})
                </dd>
              </div>
              <div>
                <dt className="font-medium">Normalized brand</dt>
                <dd>{result.camera.normalizedBrand}</dd>
              </div>
              <div>
                <dt className="font-medium">Make / model</dt>
                <dd>
                  {result.camera.make ?? "Unknown"} /{" "}
                  {result.camera.model ?? "Unknown"}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Extractor selected</dt>
                <dd>{result.extractor.selected ?? "None"}</dd>
              </div>
              <div>
                <dt className="font-medium">Primary extractor</dt>
                <dd>{result.extractor.primary ?? "None"}</dd>
              </div>
              <div>
                <dt className="font-medium">Fallback used</dt>
                <dd>{result.extractor.fallbackUsed ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="font-medium">Total shutter count</dt>
                <dd>
                  {result.extractor.totalShutterCount !== null
                    ? result.extractor.totalShutterCount.toLocaleString()
                    : "Not found"}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Mechanical shutter count</dt>
                <dd>
                  {result.extractor.mechanicalShutterCount !== null
                    ? result.extractor.mechanicalShutterCount.toLocaleString()
                    : "Not found"}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Primary count source tag</dt>
                <dd>{result.extractor.sourceTag ?? "None"}</dd>
              </div>
              <div>
                <dt className="font-medium">Mechanical source tag</dt>
                <dd>{result.extractor.mechanicalSourceTag ?? "None"}</dd>
              </div>
            </dl>

            {result.extractor.failureReason ? (
              <p className="text-red-600">
                Failure reason: {result.extractor.failureReason}
              </p>
            ) : null}
          </section>

          <section className="space-y-3 border p-4 text-sm">
            <h2 className="text-lg font-semibold">Debug</h2>
            <div>
              <p className="font-medium">Candidate tags checked</p>
              <pre className="bg-muted mt-2 overflow-x-auto p-3 text-xs">
                {formatJson(result.extractor.candidateTagsChecked)}
              </pre>
            </div>
            <div>
              <p className="font-medium">Raw values inspected</p>
              <pre className="bg-muted mt-2 overflow-x-auto p-3 text-xs">
                {formatJson(result.extractor.rawValuesInspected)}
              </pre>
            </div>
            <div>
              <p className="font-medium">Relevant metadata tags</p>
              <pre className="bg-muted mt-2 overflow-x-auto p-3 text-xs">
                {formatJson(result.debug.relevantTags)}
              </pre>
            </div>
            <div>
              <p className="font-medium">Extractor attempts</p>
              <pre className="bg-muted mt-2 overflow-x-auto p-3 text-xs">
                {formatJson(result.debug.attempts)}
              </pre>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
