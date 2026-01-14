"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "~/lib/auth/auth-client";
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
  actionSetGearTopView,
  actionClearGearTopView,
} from "~/server/admin/gear/actions";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "~/app/(app)/api/uploadthing/core";
import { Progress } from "~/components/ui/progress";
import { requireRole } from "~/lib/auth/auth-helpers";

export interface GearImageModalProps {
  gearId?: string;
  slug?: string;
  trigger?: React.ReactNode;
  onSuccess?: (params: { url: string }) => void;
  currentThumbnailUrl?: string;
  currentTopViewUrl?: string;
}

type ImageType = "thumbnail" | "topView";

export function GearImageModal(props: GearImageModalProps) {
  const { data, isPending, error } = useSession();

  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [combinedProgress, setCombinedProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [progressMode, setProgressMode] = useState<
    "upload" | "save" | "delete" | null
  >(null);
  const [activeImageType, setActiveImageType] =
    useState<ImageType>("thumbnail");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topViewFileInputRef = useRef<HTMLInputElement>(null);
  const savingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [localThumbnailUrl, setLocalThumbnailUrl] = useState<
    string | undefined
  >(props.currentThumbnailUrl ?? undefined);
  const [localTopViewUrl, setLocalTopViewUrl] = useState<string | undefined>(
    props.currentTopViewUrl ?? undefined,
  );

  // Sync when parent changes item or current image
  useEffect(() => {
    setLocalThumbnailUrl(props.currentThumbnailUrl ?? undefined);
    setLocalTopViewUrl(props.currentTopViewUrl ?? undefined);
  }, [
    props.currentThumbnailUrl,
    props.currentTopViewUrl,
    props.gearId,
    props.slug,
  ]);

  const { uploadFiles } = genUploader<OurFileRouter>();

  // Cleanup saving timer on unmount
  useEffect(() => {
    return () => {
      if (savingTimerRef.current) clearInterval(savingTimerRef.current);
    };
  }, []);

  if (isPending) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (!data) {
    return <div>Unauthenticated</div>;
  }
  const session = data.session;
  const user = data.user;

  if (!session) return null;

  const access = requireRole(user, ["EDITOR"]);
  const canDelete = requireRole(user, ["ADMIN", "SUPERADMIN"]);

  if (!access) return null;

  async function handleUploadSelected(file: File, imageType: ImageType) {
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
      setActiveImageType(imageType);
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

      if (imageType === "thumbnail") {
        await actionSetGearThumbnail({
          gearId: props.gearId,
          slug: props.slug,
          thumbnailUrl: url,
        });
        setLocalThumbnailUrl(url);
        toast.success("Front view updated.");
      } else {
        await actionSetGearTopView({
          gearId: props.gearId,
          slug: props.slug,
          topViewUrl: url,
        });
        setLocalTopViewUrl(url);
        toast.success("Top view updated.");
      }

      setCombinedProgress(100);
      if (savingTimerRef.current) {
        clearInterval(savingTimerRef.current);
        savingTimerRef.current = null;
      }
      props.onSuccess?.({ url });
      await new Promise((r) => setTimeout(r, 500));
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
      if (topViewFileInputRef.current) topViewFileInputRef.current.value = "";
    }
  }

  async function handleRemoveImage(imageType: ImageType) {
    if (!canDelete) {
      toast.error("Only admins can remove images.");
      return;
    }
    let interval: NodeJS.Timeout | null = null;
    try {
      setIsUpdating(true);
      setShowProgress(true);
      setProgressMode("delete");
      setCombinedProgress(0);
      setActiveImageType(imageType);
      if (savingTimerRef.current) clearInterval(savingTimerRef.current);
      interval = setInterval(() => {
        setCombinedProgress((prev) => (prev < 95 ? prev + 3 : prev));
      }, 120);
      savingTimerRef.current = interval;

      if (imageType === "thumbnail") {
        await actionClearGearThumbnail({
          gearId: props.gearId,
          slug: props.slug,
        });
        setLocalThumbnailUrl(undefined);
        toast.success("Front view removed.");
      } else {
        await actionClearGearTopView({
          gearId: props.gearId,
          slug: props.slug,
        });
        setLocalTopViewUrl(undefined);
        toast.success("Top view removed.");
      }

      setCombinedProgress(100);
      if (interval) {
        clearInterval(interval);
        savingTimerRef.current = null;
      }
      props.onSuccess?.({ url: "" });
      await new Promise((r) => setTimeout(r, 400));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to remove image";
      toast.error(message);
    } finally {
      setIsUpdating(false);
      setShowProgress(false);
      setProgressMode(null);
      if (interval) clearInterval(interval);
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (next && !access) {
      toast.error("You must be an admin to upload images.");
      setOpen(false);
      return;
    }
    setOpen(next);
  };

  const ImageSection = ({
    title,
    imageUrl,
    imageType,
    fileInputRef: inputRef,
  }: {
    title: string;
    imageUrl: string | undefined;
    imageType: ImageType;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
  }) => {
    const isActive = activeImageType === imageType;
    const isProcessing = (isUploading || isUpdating) && isActive;

    return (
      <div className="space-y-2">
        <div className="text-muted-foreground text-xs font-medium">{title}</div>
        {imageUrl ? (
          <div className="bg-muted dark:bg-card flex h-32 w-full items-center justify-center overflow-hidden rounded border">
            <img
              src={imageUrl}
              alt={`${title} image`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div
            className="bg-muted/40 dark:bg-card/60 flex h-32 w-full cursor-pointer items-center justify-center rounded border-2 border-dashed transition-colors hover:border-primary/50"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer?.files?.[0];
              if (file) await handleUploadSelected(file, imageType);
            }}
          >
            <div className="text-muted-foreground text-center text-sm">
              <div>Drop image here</div>
              <div className="text-xs">or click to upload</div>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            await handleUploadSelected(file, imageType);
          }}
        />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            icon={<Upload className="h-4 w-4" />}
            onClick={() => inputRef.current?.click()}
            disabled={isProcessing}
            loading={isUploading && isActive}
            className="w-full"
          >
            {isUploading && isActive
              ? `${Math.min(100, Math.round(uploadProgress))}%`
              : imageUrl
                ? "Replace"
                : "Upload"}
          </Button>

          {imageUrl && (
            <Button
              size="sm"
              icon={<Trash className="h-4 w-4" />}
              variant="destructive"
              disabled={isProcessing || !canDelete}
              className="w-full"
              onClick={() => handleRemoveImage(imageType)}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button icon={<ImageIcon className="h-4 w-4" />} variant="outline">
            Manage Images
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Gear Images</DialogTitle>
          <DialogDescription>
            Upload front view and top view images for this gear item.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-2">
          <ImageSection
            title="Front View"
            imageUrl={localThumbnailUrl}
            imageType="thumbnail"
            fileInputRef={fileInputRef}
          />
          <ImageSection
            title="Top View"
            imageUrl={localTopViewUrl}
            imageType="topView"
            fileInputRef={topViewFileInputRef}
          />
        </div>

        {showProgress && (
          <div className="space-y-2">
            <Progress value={combinedProgress} />
            <div className="text-muted-foreground text-xs">
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

        <div className="text-muted-foreground space-y-1 text-xs">
          <div>
            Upload images with transparent background, tightly cropped, 1000px
            on long edge, .webp @ 75% quality.
          </div>
          {!canDelete && (
            <div className="text-orange-600 dark:text-orange-400">
              Note: Only admins can remove images.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GearImageModal;
