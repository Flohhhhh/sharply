"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import ExifEmptyState from "./_components/exif-empty-state";
import ExifLoadingState from "./_components/exif-loading-state";
import { getExifViewerPreviewEventName } from "./_components/exif-preview-trigger";
import ExifResults from "./_components/exif-results";
import { parseFileWithClientExifTool } from "./parse/client-exiftool";
import {
  EXIF_VIEWER_ALLOWED_EXTENSIONS,
  EXIF_VIEWER_MAX_FILE_BYTES,
  type ExifTrackingHistoryResponse,
  type ExifTrackingSaveResponse,
  type ExifViewerParseRequest,
  type ExifViewerResponse,
} from "./types";

type LoadingStage = {
  label: string;
  minDurationMs: number;
};

const LOADING_STAGES: LoadingStage[] = [
  { label: "Reading file...", minDurationMs: 550 },
  { label: "Processing metadata...", minDurationMs: 700 },
  { label: "Generating report...", minDurationMs: 1_150 },
];

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.text();

  try {
    return JSON.parse(body) as T;
  } catch {
    if (body.trim().startsWith("<")) {
      throw new Error("Request returned HTML instead of JSON.");
    }

    throw new Error("Request returned an invalid JSON response.");
  }
}

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.at(-1)!.toLowerCase() : "";
}

function validateSelectedFile(file: File): string | null {
  const extension = getFileExtension(file.name);

  if (!EXIF_VIEWER_ALLOWED_EXTENSIONS.includes(extension as never)) {
    return `Unsupported file type. Supported extensions: ${EXIF_VIEWER_ALLOWED_EXTENSIONS.join(", ")}.`;
  }

  if (file.size === 0) {
    return "The selected file is empty.";
  }

  if (file.size > EXIF_VIEWER_MAX_FILE_BYTES) {
    return `File exceeds the ${Math.round(EXIF_VIEWER_MAX_FILE_BYTES / 1024 / 1024)}MB limit.`;
  }

  return null;
}

export default function ExifViewerClient() {
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const loadingRunIdRef = useRef(0);
  const mountedRef = useRef(true);
  const isParsingRef = useRef(false);
  const resultRef = useRef<ExifViewerResponse | null>(null);
  const historyDataRef = useRef<ExifTrackingHistoryResponse | null>(null);
  const requestErrorRef = useRef<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [result, setResult] = useState<ExifViewerResponse | null>(null);
  const [historyData, setHistoryData] = useState<ExifTrackingHistoryResponse | null>(
    null,
  );
  const [requestError, setRequestError] = useState<string | null>(null);
  const viewState = isParsing
    ? "loading"
    : result
      ? "results"
      : requestError
        ? "error"
        : "empty";

  useEffect(() => {
    isParsingRef.current = isParsing;
  }, [isParsing]);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    historyDataRef.current = historyData;
  }, [historyData]);

  useEffect(() => {
    requestErrorRef.current = requestError;
  }, [requestError]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      loadingRunIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const eventName = getExifViewerPreviewEventName();
    const handlePreview = () => {
      if (isParsingRef.current) {
        return;
      }

      void previewLoadingState();
    };

    window.addEventListener(eventName, handlePreview);

    return () => {
      window.removeEventListener(eventName, handlePreview);
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
    historyData: ExifTrackingHistoryResponse | null;
    errorMessage: string | null;
  }) {
    if (!mountedRef.current || loadingRunIdRef.current !== params.runId) return;

    setIsParsing(false);
    setLoadingStageIndex(0);
    setResult(params.payload);
    setHistoryData(params.historyData);
    setRequestError(params.errorMessage);

    if (!params.payload && params.errorMessage) {
      setHistoryData(null);
    }
  }

  async function previewLoadingState() {
    const runId = loadingRunIdRef.current + 1;
    loadingRunIdRef.current = runId;
    const previousResult = resultRef.current;
    const previousHistoryData = historyDataRef.current;
    const previousError = requestErrorRef.current;

    setIsParsing(true);
    setLoadingStageIndex(0);
    setRequestError(null);
    setResult(null);
    setHistoryData(null);
    setIsDragging(false);

    const stagesCompleted = await runLoadingStages(runId);
    if (!stagesCompleted) return;

    commitRunResult({
      runId,
      payload: previousResult,
      historyData: previousHistoryData,
      errorMessage: previousError,
    });
  }

  async function finalizeTrackingState(params: {
    payload: ExifViewerResponse;
  }) {
    let payload = params.payload;
    let resolvedHistoryData: ExifTrackingHistoryResponse | null = null;
    let errorMessage: string | null = null;

    try {
      if (
        payload.tracking.trackedCamera &&
        payload.tracking.saveToken &&
        payload.tracking.reason !== "not_signed_in" &&
        !payload.tracking.currentReadingSaved
      ) {
        const saveResponse = await fetch("/api/exif-tracking/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: payload.tracking.saveToken,
          }),
        });
        const savePayload =
          await readJsonResponse<ExifTrackingSaveResponse>(saveResponse);

        if (!saveResponse.ok || !savePayload.ok || !savePayload.tracking) {
          throw new Error(
            savePayload.message || "Failed to save EXIF tracking history.",
          );
        }

        payload = {
          ...payload,
          tracking: savePayload.tracking,
        };
      }

      if (payload.tracking.trackedCamera) {
        const historyResponse = await fetch(
          `/api/exif-tracking/cameras/${payload.tracking.trackedCamera.id}/history`,
        );
        const historyPayload =
          await readJsonResponse<ExifTrackingHistoryResponse & {
            message?: string;
          }>(historyResponse);

        if (
          !historyResponse.ok ||
          !historyPayload.ok ||
          !historyPayload.trackedCamera
        ) {
          throw new Error(
            historyPayload.message || "Failed to load tracking history.",
          );
        }

        resolvedHistoryData = historyPayload;
      }
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Failed to finalize EXIF result.";
    }

    return {
      payload,
      historyData: resolvedHistoryData,
      errorMessage,
    };
  }

  async function parseFile(file: File) {
    const validationMessage = validateSelectedFile(file);
    if (validationMessage) {
      setRequestError(validationMessage);
      setResult(null);
      setHistoryData(null);
      setIsDragging(false);
      return;
    }

    const runId = loadingRunIdRef.current + 1;
    loadingRunIdRef.current = runId;

    setIsParsing(true);
    setLoadingStageIndex(0);
    setRequestError(null);
    setResult(null);
    setHistoryData(null);
    setIsDragging(false);

    const requestPromise = (async () => {
      const exiftoolPayload = await parseFileWithClientExifTool(file);
      const requestBody: ExifViewerParseRequest = {
        file: {
          name: file.name,
          size: file.size,
        },
        exiftool: exiftoolPayload,
      };
      const response = await fetch("/exif-viewer/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      return await readJsonResponse<ExifViewerResponse>(response);
    })();

    const stagePromise = runLoadingStages(runId);

    let payload: ExifViewerResponse | null = null;
    let finalizedHistoryData: ExifTrackingHistoryResponse | null = null;
    let errorMessage: string | null = null;

    try {
      const parsedPayload = await requestPromise;
      const finalized = await finalizeTrackingState({
        payload: parsedPayload,
      });

      payload = finalized.payload;
      finalizedHistoryData = finalized.historyData;
      errorMessage = finalized.errorMessage;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Request failed.";
    }

    const stagesCompleted = await stagePromise;
    if (!stagesCompleted) return;

    commitRunResult({
      runId,
      payload,
      historyData: finalizedHistoryData,
      errorMessage,
    });
  }

  function handleSelectedFile(file: File | null) {
    if (!file) return;
    void parseFile(file);
  }

  function resetToolState() {
    loadingRunIdRef.current += 1;
    isParsingRef.current = false;
    resultRef.current = null;
    historyDataRef.current = null;
    requestErrorRef.current = null;
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setIsParsing(false);
    setLoadingStageIndex(0);
    setResult(null);
    setHistoryData(null);
    setRequestError(null);
    setIsDragging(false);
  }

  return (
    <div className="space-y-8">
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
        {viewState === "loading" ? (
          <ExifLoadingState
            key="loading"
            stageLabel={LOADING_STAGES[loadingStageIndex]?.label ?? "Processing..."}
            isReducedMotion={Boolean(reduceMotion)}
          />
        ) : null}
        {viewState === "empty" ? (
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
        ) : null}
        {viewState === "results" && result ? (
          <ExifResults
            key="results"
            result={result}
            initialHistoryData={historyData}
            onStartOver={resetToolState}
          />
        ) : null}
      </AnimatePresence>

      {requestError ? (
        <div className="border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200">
          {requestError}
        </div>
      ) : null}
    </div>
  );
}
