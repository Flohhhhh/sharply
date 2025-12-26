"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { ImageIcon, Trash, Upload } from "lucide-react";
import {
  actionSetGearThumbnail,
  actionClearGearThumbnail,
} from "~/server/admin/gear/actions";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "~/app/(app)/api/uploadthing/core";
import { Progress } from "~/components/ui/progress";
import type { UserRole } from "~/server/auth";

export interface GearImageModalProps {
  gearId?: string;
  slug?: string;
  trigger?: React.ReactNode;
  onSuccess?: (params: { url: string }) => void;
  currentThumbnailUrl?: string;
}

export function GearImageModal(props: GearImageModalProps) {
  const { data: session } = useSession();
  const isAdmin = useMemo(() => {
    const role = (session?.user as { role?: UserRole } | null | undefined)
      ?.role;
    return role === "EDITOR" || role === "ADMIN" || role === "SUPERADMIN";
  }, [session?.user]);
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [combinedProgress, setCombinedProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [progressMode, setProgressMode] = useState<
    "upload" | "save" | "delete" | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [localThumbnailUrl, setLocalThumbnailUrl] = useState<
    string | undefined
  >(props.currentThumbnailUrl ?? undefined);

  // Sync when parent changes item or current image
  useEffect(() => {
    setLocalThumbnailUrl(props.currentThumbnailUrl ?? undefined);
  }, [props.currentThumbnailUrl, props.gearId, props.slug]);

  const { uploadFiles } = genUploader<OurFileRouter>();

  // Cleanup saving timer on unmount
  useEffect(() => {
    return () => {
      if (savingTimerRef.current) clearInterval(savingTimerRef.current);
    };
  }, []);

  async function handleUploadSelected(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image exceeds 4MB. Choose a smaller file.");
      return;
    }
    try {
      setIsUploading(true);
      setProgressMode("upload");
      setShowProgress(true);
      setUploadProgress(0);
      setCombinedProgress(0);
      const res = await uploadFiles("gearImageUploader", {
        files: [file],
        onUploadProgress: ({ progress }) => {
          setUploadProgress(progress);
          const mapped = Math.min(75, Math.max(0, Math.round(progress * 0.75)));
          setCombinedProgress((prev) => (mapped > prev ? mapped : prev));
        },
      });
      const r: any = Array.isArray(res) ? res[0] : res;
      const url =
        (r?.serverData?.fileUrl as string) ?? (r?.url as string) ?? "";
      if (!url) throw new Error("Upload failed. Please try again.");
      setIsUpdating(true);
      setProgressMode("save");
      setCombinedProgress(75);
      if (savingTimerRef.current) clearInterval(savingTimerRef.current);
      savingTimerRef.current = setInterval(() => {
        setCombinedProgress((prev) => (prev < 95 ? prev + 2 : prev));
      }, 120);
      await actionSetGearThumbnail({
        gearId: props.gearId,
        slug: props.slug,
        thumbnailUrl: url,
      });
      setLocalThumbnailUrl(url);
      setCombinedProgress(100);
      if (savingTimerRef.current) {
        clearInterval(savingTimerRef.current);
        savingTimerRef.current = null;
      }
      toast.success("Thumbnail updated.");
      props.onSuccess?.({ url });
      await new Promise((r) => setTimeout(r, 500));
      setOpen(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to upload";
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setIsUpdating(false);
      setProgressMode(null);
      setShowProgress(false);
      if (savingTimerRef.current) {
        clearInterval(savingTimerRef.current);
        savingTimerRef.current = null;
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (next && !isAdmin) {
      toast.error("You must be an admin to upload images.");
      setOpen(false);
      return;
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button icon={<ImageIcon className="h-4 w-4" />} variant="outline">
            Manage Image
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Gear Image</DialogTitle>
          <DialogDescription>
            Upload a single image. It will be set as this item's thumbnail.
          </DialogDescription>
        </DialogHeader>

        {localThumbnailUrl ? (
          <div className="space-y-2">
            <div className="text-muted-foreground text-xs">Current image</div>
            <div className="bg-muted dark:bg-card flex h-32 w-full items-center justify-center overflow-hidden rounded border">
              {/* Use img to avoid Next/Image complexity inside modal */}
              <img
                src={localThumbnailUrl}
                alt="Current gear image"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-muted-foreground text-xs">Upload image</div>
            <div
              className="bg-muted/40 dark:bg-card/60 flex h-32 w-full cursor-pointer items-center justify-center rounded border-2 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer?.files?.[0];
                if (file) await handleUploadSelected(file);
              }}
            >
              <div className="text-muted-foreground text-sm">
                Drop image here or click to upload
              </div>
            </div>
          </div>
        )}

        <div className="relative space-y-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await handleUploadSelected(file);
              }}
            />

            <Button
              size="sm"
              icon={<Upload className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isUpdating}
              loading={isUploading}
              className="w-full"
            >
              {isUploading
                ? `Uploading ${Math.min(100, Math.round(uploadProgress))}%`
                : localThumbnailUrl
                  ? "Replace"
                  : "Upload"}
            </Button>

            {localThumbnailUrl && (
              <Button
                size="sm"
                icon={<Trash className="h-4 w-4" />}
                variant="destructive"
                disabled={isUploading || isUpdating}
                className="w-full"
                onClick={async () => {
                  let interval: NodeJS.Timeout | null = null;
                  try {
                    setIsUpdating(true);
                    setShowProgress(true);
                    setProgressMode("delete");
                    setCombinedProgress(0);
                    if (savingTimerRef.current)
                      clearInterval(savingTimerRef.current);
                    interval = setInterval(() => {
                      setCombinedProgress((prev) =>
                        prev < 95 ? prev + 3 : prev,
                      );
                    }, 120);
                    savingTimerRef.current = interval;
                    await actionClearGearThumbnail({
                      gearId: props.gearId,
                      slug: props.slug,
                    });
                    setLocalThumbnailUrl(undefined);
                    setCombinedProgress(100);
                    if (interval) {
                      clearInterval(interval);
                      savingTimerRef.current = null;
                    }
                    toast.success("Thumbnail removed.");
                    props.onSuccess?.({ url: "" });
                    await new Promise((r) => setTimeout(r, 400));
                    setOpen(false);
                  } catch (e) {
                    const message =
                      e instanceof Error ? e.message : "Failed to remove image";
                    toast.error(message);
                  } finally {
                    setIsUpdating(false);
                    setShowProgress(false);
                    setProgressMode(null);
                    if (interval) clearInterval(interval);
                  }
                }}
              >
                Remove
              </Button>
            )}
          </div>

          {showProgress && (
            <div className="space-y-2 pt-1.5">
              <Progress value={combinedProgress} />
              <div className="text-muted-foreground mt-1 text-xs">
                {progressMode === "upload"
                  ? `Uploading ${Math.min(100, Math.round(uploadProgress))}%`
                  : progressMode === "delete"
                    ? combinedProgress < 100
                      ? "Deleting…"
                      : "Deleted"
                    : combinedProgress < 100
                      ? "Saving…"
                      : "Done"}
              </div>
            </div>
          )}
        </div>

        <div className="text-muted-foreground text-xs">
          Max 1 file, 4MB. Admins only. Use .webp, transparent background, max
          800px on long edge.
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GearImageModal;
