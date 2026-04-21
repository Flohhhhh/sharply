"use client";

import { Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { ExifTrackingHistoryResponse } from "../types";
import ExifTrackingHistoryChart from "./exif-tracking-history-chart";

type ExifTrackingHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExifTrackingHistoryResponse | null;
  loading: boolean;
  error: string | null;
  deletingReadingId: string | null;
  onDeleteReading: (readingId: string) => void;
};

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatCount(value: number | null) {
  return value === null ? "—" : value.toLocaleString();
}

export default function ExifTrackingHistoryDialog({
  open,
  onOpenChange,
  data,
  loading,
  error,
  deletingReadingId,
  onDeleteReading,
}: ExifTrackingHistoryDialogProps) {
  const trackedCamera = data?.trackedCamera;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{trackedCamera?.title ?? "Tracking History"}</DialogTitle>
          <DialogDescription>
            {trackedCamera
              ? `${trackedCamera.readingCount} saved reading${trackedCamera.readingCount === 1 ? "" : "s"}`
              : "Review the private shutter-count history saved for this camera."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-muted-foreground text-sm">Loading history...</div>
        ) : error ? (
          <div className="text-sm text-red-300">{error}</div>
        ) : trackedCamera ? (
          <div className="flex min-h-0 flex-col gap-4">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-muted-foreground">Latest count</dt>
                <dd>{formatCount(trackedCamera.latestPrimaryCountValue)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">Latest capture</dt>
                <dd>{formatDateTime(trackedCamera.latestCaptureAt)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">First seen</dt>
                <dd>{formatDateTime(trackedCamera.firstSeenAt)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">Last seen</dt>
                <dd>{formatDateTime(trackedCamera.lastSeenAt)}</dd>
              </div>
            </dl>

            <ExifTrackingHistoryChart readings={data.readings} />

            {data.readings.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="readings" className="border-b-0">
                  <AccordionTrigger className="rounded-lg border border-white/10 px-4 py-3 text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span>Saved readings</span>
                      <span className="text-muted-foreground text-xs">
                        {data.readings.length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="max-h-[min(40vh,28rem)] overflow-y-auto rounded-lg border border-white/10">
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-background">
                          <TableRow>
                            <TableHead>Capture date</TableHead>
                            <TableHead>Primary count</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Mechanical</TableHead>
                            <TableHead>Saved at</TableHead>
                            <TableHead className="w-[1%] text-right">Delete</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.readings.map((reading) => (
                            <TableRow key={reading.id}>
                              <TableCell>{formatDateTime(reading.captureAt)}</TableCell>
                              <TableCell>
                                {reading.primaryCountValue.toLocaleString()}
                              </TableCell>
                              <TableCell>{formatCount(reading.totalShutterCount)}</TableCell>
                              <TableCell>
                                {formatCount(reading.mechanicalShutterCount)}
                              </TableCell>
                              <TableCell>{formatDateTime(reading.createdAt)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => onDeleteReading(reading.id)}
                                  loading={deletingReadingId === reading.id}
                                  aria-label="Delete saved reading"
                                >
                                  <Trash2 />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <div className="text-muted-foreground text-sm">
                No saved readings were returned for this camera.
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            No tracking history is available yet.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
