"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import ExifEmptyState from "./_components/exif-empty-state";
import ExifLoadingState from "./_components/exif-loading-state";
import {
  EXIF_VIEWER_ALLOWED_EXTENSIONS,
  EXIF_VIEWER_MAX_FILE_BYTES,
  type ExifViewerResponse,
} from "./types";

type LoadingStage = {
  label: string;
  minDurationMs: number;
};

const LOADING_STAGES: LoadingStage[] = [
  { label: "Uploading file...", minDurationMs: 550 },
  { label: "Processing metadata...", minDurationMs: 700 },
  { label: "Generating report...", minDurationMs: 1_150 },
];

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function ExifViewerClient() {
  const reduceMotion = useReducedMotion();
  const isLocalPreviewMode = process.env.NODE_ENV !== "production";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const loadingRunIdRef = useRef(0);
  const mountedRef = useRef(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [pendingResult, setPendingResult] = useState<ExifViewerResponse | null>(
    null,
  );
  const [result, setResult] = useState<ExifViewerResponse | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      loadingRunIdRef.current += 1;
    };
  }, []);

  async function runLoadingStages(runId: number) {
    for (let index = 0; index < LOADING_STAGES.length; index += 1) {
      if (!mountedRef.current || loadingRunIdRef.current !== runId) return false;
      setLoadingStageIndex(index);
      await sleep(LOADING_STAGES[index]!.minDurationMs);
    }

    return mountedRef.current && loadingRunIdRef.current === runId;
  }

  function commitRunResult(params: {
    runId: number;
    payload: ExifViewerResponse | null;
    errorMessage: string | null;
  }) {
    if (!mountedRef.current || loadingRunIdRef.current !== params.runId) return;

    setPendingResult(null);
    setIsParsing(false);
    setLoadingStageIndex(0);

    if (params.errorMessage) {
      setResult(null);
      setRequestError(params.errorMessage);
      return;
    }

    setRequestError(null);
    setResult(params.payload);
  }

  async function previewLoadingState() {
    const runId = loadingRunIdRef.current + 1;
    loadingRunIdRef.current = runId;

    setIsParsing(true);
    setLoadingStageIndex(0);
    setActiveFileName("Preview loading run");
    setRequestError(null);
    setResult(null);
    setPendingResult(null);
    setIsDragging(false);

    const stagesCompleted = await runLoadingStages(runId);
    if (!stagesCompleted) return;

    commitRunResult({
      runId,
      payload: null,
      errorMessage: null,
    });
  }

  async function parseFile(file: File) {
    const runId = loadingRunIdRef.current + 1;
    loadingRunIdRef.current = runId;

    setIsParsing(true);
    setLoadingStageIndex(0);
    setActiveFileName(file.name);
    setRequestError(null);
    setResult(null);
    setPendingResult(null);
    setIsDragging(false);

    const formData = new FormData();
    formData.set("file", file);

    const requestPromise = (async () => {
      const response = await fetch("/exif-viewer/parse", {
        method: "POST",
        body: formData,
      });
      return (await response.json()) as ExifViewerResponse;
    })();

    const stagePromise = runLoadingStages(runId);

    let payload: ExifViewerResponse | null = null;
    let errorMessage: string | null = null;

    try {
      payload = await requestPromise;
      if (mountedRef.current && loadingRunIdRef.current === runId) {
        setPendingResult(payload);
      }
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Request failed.";
    }

    const stagesCompleted = await stagePromise;
    if (!stagesCompleted) return;

    commitRunResult({
      runId,
      payload,
      errorMessage,
    });
  }

  function handleSelectedFile(file: File | null) {
    if (!file) return;
    void parseFile(file);
  }

  return (
    <div className="mx-auto mt-20 max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl sm:text-4xl font-semibold">Shutter Count & EXIF Viewer</h1>
        {isLocalPreviewMode ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isParsing}
            onClick={() => void previewLoadingState()}
          >
            Preview loading
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept={EXIF_VIEWER_ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(",")}
          className="sr-only"
          onChange={(event) =>
            handleSelectedFile(event.currentTarget.files?.[0] ?? null)
          }
        />
        <AnimatePresence mode="wait" initial={false}>
          {isParsing ? (
            <ExifLoadingState
              key="loading"
              stageLabel={LOADING_STAGES[loadingStageIndex]?.label ?? "Processing..."}
              isReducedMotion={Boolean(reduceMotion)}
            />
          ) : (
            <ExifEmptyState
              key="empty"
              isDragging={isDragging}
              supportedExtensions={EXIF_VIEWER_ALLOWED_EXTENSIONS}
              maxFileBytes={EXIF_VIEWER_MAX_FILE_BYTES}
              onBrowse={() => inputRef.current?.click()}
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
            />
          )}
        </AnimatePresence>
      </div>

      {requestError ? (
        <div className="border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200">
          {requestError}
        </div>
      ) : null}

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
