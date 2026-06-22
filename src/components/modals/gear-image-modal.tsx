"use client";

import { ImageIcon, Trash, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "~/app/api/uploadthing/core";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Progress } from "~/components/ui/progress";
import { useSession } from "~/lib/auth/auth-client";
import { requireRole } from "~/lib/auth/auth-helpers";
import {
  createGearOgImageFileFromSource,
  shouldAutoGenerateGearOgImageOnThumbnailUpload,
} from "~/lib/gear/og-image";
import type { GearType } from "~/types/gear";
import type { GearColorway } from "~/types/gear";
import { actionSetGearColorwayImage } from "~/server/admin/colorways/actions";
import {
  actionClearGearRearView,
  actionClearGearThumbnail,
  actionClearGearTopView,
  actionSetGearRearView,
  actionSetGearThumbnail,
  actionSetGearTopView,
} from "~/server/admin/gear/actions";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

export interface GearImageModalProps {
  gearId?: string;
  slug?: string;
  gearType: GearType;
  trigger?: React.ReactNode;
  onSuccess?: (params: { url: string }) => void;
  currentThumbnailUrl?: string;
  currentTopViewUrl?: string;
  currentRearViewUrl?: string;
  currentColorways?: GearColorway[];
}

type ImageType = "thumbnail" | "topView" | "rearView";

type GearImageUploadResult = {
  url?: string;
  serverData?: {
    fileUrl?: string;
  };
};

export function GearImageModal(props: GearImageModalProps) {
  const t = useTranslations("gearDetail.gearImages");
  const statusT = useTranslations("gearDetail.editGear.status");
  const profileT = useTranslations("profileSettings");
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
  const [localColorways, setLocalColorways] = useState(
    () => props.currentColorways ?? [],
  );
  const [selectedColorwayId, setSelectedColorwayId] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topViewFileInputRef = useRef<HTMLInputElement>(null);
  const rearViewFileInputRef = useRef<HTMLInputElement>(null);
  const savingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [localThumbnailUrl, setLocalThumbnailUrl] = useState<
    string | undefined
  >(props.currentThumbnailUrl ?? undefined);
  const [localTopViewUrl, setLocalTopViewUrl] = useState<string | undefined>(
    props.currentTopViewUrl ?? undefined,
  );
  const [localRearViewUrl, setLocalRearViewUrl] = useState<string | undefined>(
    props.currentRearViewUrl ?? undefined,
  );
  const supportsRearView =
    props.gearType === "CAMERA" || props.gearType === "ANALOG_CAMERA";
  const activeColorwayId = localColorways.some(
    (colorway) => colorway.id === selectedColorwayId,
  )
    ? (selectedColorwayId ?? "")
    : (localColorways[0]?.id ?? "");
  const selectedColorway = localColorways.find(
    (colorway) => colorway.id === activeColorwayId,
  );
  const isExplicitMode = localColorways.length > 0;
  const isDefaultColorway = localColorways[0]?.id === activeColorwayId;
  const displayedThumbnailUrl = isExplicitMode
    ? (selectedColorway?.frontImageUrl ?? undefined)
    : localThumbnailUrl;
  const displayedTopViewUrl = isExplicitMode
    ? (selectedColorway?.topViewUrl ?? undefined)
    : localTopViewUrl;
  const displayedRearViewUrl = isExplicitMode
    ? (selectedColorway?.rearViewUrl ?? undefined)
    : localRearViewUrl;

  // Sync when parent changes item or current image
  useEffect(() => {
    const nextColorways = props.currentColorways ?? [];
    setLocalColorways(nextColorways);
    setLocalThumbnailUrl(props.currentThumbnailUrl ?? undefined);
    setLocalTopViewUrl(props.currentTopViewUrl ?? undefined);
    setLocalRearViewUrl(props.currentRearViewUrl ?? undefined);
  }, [
    props.currentThumbnailUrl,
    props.currentTopViewUrl,
    props.currentRearViewUrl,
    props.gearId,
    props.slug,
    props.currentColorways,
  ]);

  function selectColorway(colorwayId: string) {
    const colorway = localColorways.find((item) => item.id === colorwayId);
    if (!colorway) return;
    setSelectedColorwayId(colorwayId);
  }

  const { uploadFiles } = genUploader<OurFileRouter>();

  async function uploadGearImageFile(
    file: File,
    onProgress?: (progress: number) => void,
  ) {
    const res = await uploadFiles("gearImageUploader", {
      files: [file],
      onUploadProgress: onProgress
        ? ({ progress }) => {
            onProgress(progress);
          }
        : undefined,
    });
    const uploads: GearImageUploadResult[] = Array.isArray(res) ? res : [];
    const upload = uploads[0];
    const url = upload?.serverData?.fileUrl ?? upload?.url ?? "";
    if (!url) throw new Error(profileT("uploadFailedTryAgain"));
    return url;
  }

  // Cleanup saving timer on unmount
  useEffect(() => {
    return () => {
      if (savingTimerRef.current) clearInterval(savingTimerRef.current);
    };
  }, []);

  if (isPending) {
    return <div>{statusT("loading")}</div>;
  }
  if (error) {
    return <div>{statusT("error", { error: error.message })}</div>;
  }
  if (!data) {
    return <div>{statusT("unauthenticated")}</div>;
  }
  const session = data.session;
  const user = data.user;

  if (!session) return null;

  const access = requireRole(user, ["EDITOR"]);
  const canDelete = requireRole(user, ["ADMIN", "SUPERADMIN"]);

  if (!access) return null;

  async function handleUploadSelected(file: File, imageType: ImageType) {
    if (file.size > 4 * 1024 * 1024) {
      toast.error(profileT("imageExceedsLimit"));
      return;
    }
    try {
      setIsUploading(true);
      setProgressMode("upload");
      setShowProgress(true);
      setUploadProgress(0);
      setCombinedProgress(0);
      setActiveImageType(imageType);
      const url = await uploadGearImageFile(file, (progress) => {
        setUploadProgress(progress);
        const mapped = Math.min(60, Math.max(0, Math.round(progress * 0.6)));
        setCombinedProgress((prev) => (mapped > prev ? mapped : prev));
      });

      let ogImageUrl: string | null | undefined;
      const shouldGenerateOgImage =
        (!isExplicitMode || isDefaultColorway) &&
        shouldAutoGenerateGearOgImageOnThumbnailUpload({
          imageType,
          currentThumbnailUrl: displayedThumbnailUrl,
        });

      if (imageType === "thumbnail" && shouldGenerateOgImage) {
        try {
          setCombinedProgress((prev) => (prev < 62 ? 62 : prev));
          const ogImageFile = await createGearOgImageFileFromSource({
            source: file,
            fileNameStem: `${props.slug ?? props.gearId ?? "gear"}-og`,
          });
          ogImageUrl = await uploadGearImageFile(ogImageFile, (progress) => {
            const mapped = 60 + Math.round(progress * 0.15);
            setCombinedProgress((prev) => (mapped > prev ? mapped : prev));
          });
        } catch (error) {
          console.error(
            "Failed to generate gear OG image during upload",
            error,
          );
          ogImageUrl = null;
        }
      } else if (imageType === "thumbnail" && displayedThumbnailUrl) {
        // Replacements should fall back to the fresh thumbnail until an admin
        // backfill/regeneration run stores a new dedicated OG asset.
        ogImageUrl = null;
      }

      setIsUpdating(true);
      setProgressMode("save");
      setCombinedProgress(75);
      if (savingTimerRef.current) clearInterval(savingTimerRef.current);
      savingTimerRef.current = setInterval(() => {
        setCombinedProgress((prev) => (prev < 95 ? prev + 2 : prev));
      }, 120);

      if (isExplicitMode && (!selectedColorway || !props.gearId)) {
        throw new Error(t("colorwayContextMissing"));
      }

      if (isExplicitMode) {
        const result = await actionSetGearColorwayImage({
          gearId: props.gearId!,
          colorwayId: selectedColorway!.id,
          imageType: imageType === "thumbnail" ? "front" : imageType,
          imageUrl: url,
          ogImageUrl,
        });
        setLocalColorways((current) =>
          current.map((item) =>
            item.id === result.colorway.id ? result.colorway : item,
          ),
        );
      } else if (imageType === "thumbnail") {
        await actionSetGearThumbnail({
          gearId: props.gearId,
          slug: props.slug,
          thumbnailUrl: url,
          ogImageUrl,
        });
        setLocalThumbnailUrl(url);
      } else if (imageType === "topView") {
        await actionSetGearTopView({
          gearId: props.gearId,
          slug: props.slug,
          topViewUrl: url,
        });
        setLocalTopViewUrl(url);
      } else {
        await actionSetGearRearView({
          gearId: props.gearId,
          slug: props.slug,
          rearViewUrl: url,
        });
        setLocalRearViewUrl(url);
      }
      toast.success(
        t("updated", {
          view: getImageTypeLabel(t, imageType),
        }),
      );

      setCombinedProgress(100);
      if (savingTimerRef.current) {
        clearInterval(savingTimerRef.current);
        savingTimerRef.current = null;
      }
      props.onSuccess?.({ url });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to upload";
      toast.error(message || profileT("failedToUpload"));
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
      if (rearViewFileInputRef.current) rearViewFileInputRef.current.value = "";
    }
  }

  async function handleRemoveImage(imageType: ImageType) {
    if (!canDelete) {
      toast.error(t("removeImageAdminOnly"));
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

      if (isExplicitMode && (!selectedColorway || !props.gearId)) {
        throw new Error(t("colorwayContextMissing"));
      }

      if (isExplicitMode) {
        const result = await actionSetGearColorwayImage({
          gearId: props.gearId!,
          colorwayId: selectedColorway!.id,
          imageType: imageType === "thumbnail" ? "front" : imageType,
          imageUrl: null,
        });
        setLocalColorways((current) =>
          current.map((item) =>
            item.id === result.colorway.id ? result.colorway : item,
          ),
        );
      } else if (imageType === "thumbnail") {
        await actionClearGearThumbnail({
          gearId: props.gearId,
          slug: props.slug,
        });
        setLocalThumbnailUrl(undefined);
      } else if (imageType === "topView") {
        await actionClearGearTopView({
          gearId: props.gearId,
          slug: props.slug,
        });
        setLocalTopViewUrl(undefined);
      } else {
        await actionClearGearRearView({
          gearId: props.gearId,
          slug: props.slug,
        });
        setLocalRearViewUrl(undefined);
      }
      toast.success(
        t("removed", {
          view: getImageTypeLabel(t, imageType),
        }),
      );

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
      toast.error(t("editorRequired"));
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
          <div className="bg-muted dark:bg-card h-52 w-full rounded border p-5">
            <div className="relative h-full w-full overflow-hidden rounded-sm">
              <Image
                src={imageUrl}
                alt={`${title} image`}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 32rem"
                className="object-contain"
              />
            </div>
          </div>
        ) : (
          <div
            className="bg-muted/40 dark:bg-card/60 hover:border-primary/50 flex h-52 w-full cursor-pointer items-center justify-center rounded border-2 border-dashed p-5 transition-colors"
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
              <div>{profileT("dropImageHere")}</div>
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
              ? profileT("uploadingProgress", {
                  percent: Math.min(100, Math.round(uploadProgress)),
                })
              : imageUrl
                ? profileT("replace")
                : profileT("upload")}
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
            {t("manageButton")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t("manageTitle")}</DialogTitle>
          <DialogDescription>
            {supportsRearView
              ? t("manageDescription")
              : t("manageDescriptionNoRearView")}
          </DialogDescription>
        </DialogHeader>

        {isExplicitMode ? (
          <Tabs value={activeColorwayId} onValueChange={selectColorway}>
            <TabsList className="h-auto max-w-full justify-start gap-1 overflow-x-auto rounded-md border border-input/70 bg-background/70 p-1 shadow-sm">
              {localColorways.map((colorway) => (
                <TabsTrigger
                  key={colorway.id}
                  value={colorway.id}
                  className="h-8 rounded-sm px-3 text-xs font-semibold text-foreground/70 data-[state=active]:border-border data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  {colorway.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : null}

        <div
          className={`grid gap-10 ${
            supportsRearView ? "md:grid-cols-3" : "md:grid-cols-2"
          }`}
        >
          <ImageSection
            title={t("frontView")}
            imageUrl={displayedThumbnailUrl}
            imageType="thumbnail"
            fileInputRef={fileInputRef}
          />
          <ImageSection
            title={t("topView")}
            imageUrl={displayedTopViewUrl}
            imageType="topView"
            fileInputRef={topViewFileInputRef}
          />
          {supportsRearView ? (
            <ImageSection
              title={t("rearView")}
              imageUrl={displayedRearViewUrl}
              imageType="rearView"
              fileInputRef={rearViewFileInputRef}
            />
          ) : null}
        </div>

        {showProgress && (
          <div className="space-y-2">
            <Progress value={combinedProgress} />
            <div className="text-muted-foreground text-xs">
              {progressMode === "upload"
                ? profileT("uploadingProgress", {
                    percent: Math.min(100, Math.round(uploadProgress)),
                  })
                : progressMode === "delete"
                  ? combinedProgress < 100
                    ? t("deleting")
                    : t("deleted")
                  : combinedProgress < 100
                    ? profileT("saving")
                    : profileT("done")}
            </div>
          </div>
        )}

        <div className="text-muted-foreground space-y-1 text-xs">
          <div>{t("limits")}</div>
          {!canDelete && (
            <div className="text-orange-600 dark:text-orange-400">
              {t("removeNote")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GearImageModal;

function getImageTypeLabel(
  t: (key: "frontView" | "topView" | "rearView") => string,
  imageType: ImageType,
) {
  if (imageType === "thumbnail") return t("frontView");
  if (imageType === "topView") return t("topView");
  return t("rearView");
}
