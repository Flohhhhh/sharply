"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import ExifEmptyState from "./_components/exif-empty-state";
import ExifLoadingState from "./_components/exif-loading-state";
import { getExifViewerPreviewEventName } from "./_components/exif-preview-trigger";
import ExifResults from "./_components/exif-results";
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

export default function ExifViewerClient() {
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const loadingRunIdRef = useRef(0);
  const mountedRef = useRef(true);
  const isParsingRef = useRef(false);
  const resultRef = useRef<ExifViewerResponse | null>(null);
  const requestErrorRef = useRef<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [result, setResult] = useState<ExifViewerResponse | null>(null);
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
    errorMessage: string | null;
  }) {
    if (!mountedRef.current || loadingRunIdRef.current !== params.runId) return;

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
    const previousResult = resultRef.current;
    const previousError = requestErrorRef.current;

    setIsParsing(true);
    setLoadingStageIndex(0);
    setRequestError(null);
    setResult(null);
    setIsDragging(false);

    const stagesCompleted = await runLoadingStages(runId);
    if (!stagesCompleted) return;

    commitRunResult({
      runId,
      payload: previousResult,
      errorMessage: previousError,
    });
  }

  async function parseFile(file: File) {
    const runId = loadingRunIdRef.current + 1;
    loadingRunIdRef.current = runId;

    setIsParsing(true);
    setLoadingStageIndex(0);
    setRequestError(null);
    setResult(null);
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

  function resetToolState() {
    loadingRunIdRef.current += 1;
    isParsingRef.current = false;
    resultRef.current = null;
    requestErrorRef.current = null;
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setIsParsing(false);
    setLoadingStageIndex(0);
    setResult(null);
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
