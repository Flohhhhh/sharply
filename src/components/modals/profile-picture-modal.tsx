"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ImageIcon, Upload } from "lucide-react";
import { actionUpdateProfileImage } from "~/server/users/actions";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "~/app/api/uploadthing/core";
import { Progress } from "~/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useTranslations } from "next-intl";

export interface ProfilePictureModalProps {
  trigger?: React.ReactNode;
  onSuccess?: (params: { url: string }) => void;
  currentImageUrl?: string | null;
}

export function ProfilePictureModal(props: ProfilePictureModalProps) {
  const t = useTranslations("profileSettings");
  const router = useRouter();
  const { data } = useSession();

  const session = data?.session;
  const user = data?.user;

  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [combinedProgress, setCombinedProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [progressMode, setProgressMode] = useState<"upload" | "save" | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(
    props.currentImageUrl ?? null,
  );
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Constants
  const CLOSE_MODAL_DELAY_MS = 500;

  // Sync when parent changes current image
  useEffect(() => {
    setLocalImageUrl(props.currentImageUrl ?? null);
    if (props.currentImageUrl && props.currentImageUrl === previewImageUrl) {
      setPreviewImageUrl(null);
    }
  }, [props.currentImageUrl, previewImageUrl]);

  const { uploadFiles } = genUploader<OurFileRouter>();

  // Cleanup saving timer on unmount
  useEffect(() => {
    return () => {
      if (savingTimerRef.current) clearInterval(savingTimerRef.current);
    };
  }, []);

  // Function to resize image to max 256px on longest side
  async function resizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          // Determine canvas size (capped at 256px) and draw with cover cropping
          const maximumCanvasDimension = 256;
          const longestSide = Math.max(img.width, img.height);
          const targetCanvasSize = Math.min(
            maximumCanvasDimension,
            longestSide,
          );

          canvas.width = targetCanvasSize;
          canvas.height = targetCanvasSize;

          const scale = Math.max(
            targetCanvasSize / img.width,
            targetCanvasSize / img.height,
          );

          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const offsetX = (targetCanvasSize - drawWidth) / 2;
          const offsetY = (targetCanvasSize - drawHeight) / 2;

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Could not create blob"));
                return;
              }
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            },
            file.type,
            0.9, // Quality setting
          );
        };
        img.onerror = () => reject(new Error("Could not load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });
  }

  async function handleUploadSelected(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      toast.error(t("imageExceedsLimit"));
      return;
    }
    try {
      setIsUploading(true);
      setProgressMode("upload");
      setShowProgress(true);
      setUploadProgress(0);
      setCombinedProgress(0);

      // Resize image before upload
      const resizedFile = await resizeImage(file);

      const res = await uploadFiles("profilePictureUploader", {
        files: [resizedFile],
        onUploadProgress: ({ progress }) => {
          setUploadProgress(progress);
          const mapped = Math.min(75, Math.max(0, Math.round(progress * 0.75)));
          setCombinedProgress((prev) => (mapped > prev ? mapped : prev));
        },
      });

      type UploadResponse = {
        serverData?: { fileUrl?: string };
        url?: string;
      };

      const uploadResult = (
        Array.isArray(res) ? res[0] : res
      ) as UploadResponse;
      const url = uploadResult?.serverData?.fileUrl ?? uploadResult?.url ?? "";
      if (!url) throw new Error(t("uploadFailedTryAgain"));
      setIsUpdating(true);
      setProgressMode("save");
      setCombinedProgress(75);
      if (savingTimerRef.current) clearInterval(savingTimerRef.current);
      savingTimerRef.current = setInterval(() => {
        setCombinedProgress((prev) => (prev < 95 ? prev + 2 : prev));
      }, 120);
      await actionUpdateProfileImage(url);
      setLocalImageUrl(url);
      setPreviewImageUrl(url);
      setCombinedProgress(100);
      if (savingTimerRef.current) {
        clearInterval(savingTimerRef.current);
        savingTimerRef.current = null;
      }

      // Update session to reflect new image
      // TODO: check if we need to do anything here with betterAuth
      // await updateSession();

      toast.success(t("profilePictureUpdated"));
      props.onSuccess?.({ url });
      router.refresh();
      await new Promise((r) => setTimeout(r, CLOSE_MODAL_DELAY_MS));
      setOpen(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : t("failedToUpload");
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
    if (next && !session) {
      toast.error(t("mustBeSignedInToUpdateProfilePicture"));
      setOpen(false);
      return;
    }
    setOpen(next);
  };

  if (!session || !user) return null;

  const userName = user.name ?? t("user");
  const userInitial = userName.charAt(0).toUpperCase();
  const displayedImageUrl = previewImageUrl ?? localImageUrl;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button icon={<ImageIcon className="h-4 w-4" />} variant="outline">
            {t("updateProfilePicture")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("updateProfilePicture")}</DialogTitle>
          <DialogDescription>
            {t("uploadProfilePictureDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-muted-foreground text-xs">{t("currentPicture")}</div>
            <div className="bg-muted dark:bg-card flex h-32 w-full items-center justify-center overflow-hidden rounded border">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={displayedImageUrl ?? undefined}
                  alt={userName}
                />
                <AvatarFallback className="text-2xl">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {!displayedImageUrl && (
            <div className="space-y-2">
              <div className="text-muted-foreground text-xs">
                {t("uploadNewPicture")}
              </div>
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
                  {t("dropImageHere")}
                </div>
              </div>
            </div>
          )}
        </div>

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
                ? t("uploadingProgress", {
                    percent: Math.min(100, Math.round(uploadProgress)),
                  })
                : displayedImageUrl
                  ? t("replace")
                  : t("upload")}
            </Button>
          </div>

          {showProgress && (
            <div className="space-y-2 pt-1.5">
              <Progress value={combinedProgress} />
              <div className="text-muted-foreground mt-1 text-xs">
                {progressMode === "upload"
                  ? t("uploadingProgress", {
                      percent: Math.min(100, Math.round(uploadProgress)),
                    })
                  : combinedProgress < 100
                    ? t("saving")
                    : t("done")}
              </div>
            </div>
          )}
        </div>

        <div className="text-muted-foreground text-xs">
          {t("profilePictureLimits")}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProfilePictureModal;
