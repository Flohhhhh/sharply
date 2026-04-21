"use client";

import { useLocale } from "next-intl";
import { useEffect,useMemo,useState } from "react";
import { toast } from "sonner";

import { Dock,DockIcon } from "~/components/ui/dock";
import {
  TooltipProvider
} from "~/components/ui/tooltip";
import { useSession } from "~/lib/auth/auth-client";
import { requireRole } from "~/lib/auth/auth-helpers";
import {
  actionAddGearRawSample,
  actionRemoveGearRawSample,
} from "~/server/gear/actions";
import type { GearAlternativeRow } from "~/server/gear/service";
import type { RawSample } from "~/types/gear";
import { buildDockButtons } from "./dock-buttons";

interface GearItemDockClientProps {
  slug: string;
  gearId?: string;
  gearType: string;
  currentThumbnailUrl?: string | null;
  currentTopViewUrl?: string | null;
  alternatives?: GearAlternativeRow[];
  rawSamples?: RawSample[];
  hasCreatorVideos?: boolean;
}

type ManagedSampleState = Omit<RawSample, "createdAt" | "updatedAt"> & {
  createdAt?: string | null;
  updatedAt?: string | null;
};

type RawSampleUploadItem = {
  url?: string;
  ufsUrl?: string;
  name?: string;
  fileName?: string;
  mimeType?: string;
  type?: string;
  size?: number;
  serverData?: {
    fileUrl?: string;
    fileName?: string;
    contentType?: string;
    size?: number;
  };
};

const MAX_SAMPLES = 3;

function normalizeSampleDates(sample: RawSample): ManagedSampleState {
  const normalize = (value: unknown) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    try {
      return new Date(value as any).toISOString();
    } catch {
      return null;
    }
  };

  return {
    ...sample,
    createdAt: normalize(sample.createdAt),
    updatedAt: normalize(sample.updatedAt),
  };
}

export function GearItemDockClient({
  slug,
  gearId,
  gearType,
  currentThumbnailUrl = null,
  currentTopViewUrl = null,
  alternatives = [],
  rawSamples = [],
  hasCreatorVideos = false,
}: GearItemDockClientProps) {
  const locale = useLocale();
  const { data } = useSession();
  const user = data?.user;

  const [managedSamples, setManagedSamples] = useState<ManagedSampleState[]>(
    () => rawSamples.map(normalizeSampleDates),
  );
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [deletingSampleId, setDeletingSampleId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setManagedSamples(rawSamples.map(normalizeSampleDates));
  }, [rawSamples]);

  const handleSampleUploadCompletion = async (items?: unknown[]) => {
    if (managedSamples.length >= MAX_SAMPLES) {
      toast.error("Only three samples are allowed per gear item.");
      return;
    }
    if (!items?.length) return;
    setIsUploading(true);
    try {
      const uploadItems = items as RawSampleUploadItem[];
      for (const item of uploadItems) {
        const fileUrl =
          item.serverData?.fileUrl ??
          item.url ??
          item.ufsUrl ??
          "";
        if (!fileUrl) continue;
        const originalFilename =
          item.serverData?.fileName ??
          item.fileName ??
          item.name ??
          fileUrl.split("/").pop() ??
          "sample";
        const contentType =
          item.serverData?.contentType ??
          item.mimeType ??
          item.type ??
          null;
        const sizeBytes =
          typeof item.size === "number"
            ? item.size
            : typeof item.serverData?.size === "number"
              ? item.serverData.size
              : null;
        const newSample = await actionAddGearRawSample(slug, {
          fileUrl,
          originalFilename,
          contentType,
          sizeBytes,
        });
        setManagedSamples((prev) => [...prev, normalizeSampleDates(newSample)]);
        toast.success("Sample uploaded");
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload sample";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSampleRemoval = async (sampleId: string) => {
    setDeletingSampleId(sampleId);
    try {
      await actionRemoveGearRawSample(slug, sampleId);
      setManagedSamples((prev) =>
        prev.filter((sample) => sample.id !== sampleId),
      );
      toast.success("Sample removed");
    } catch {
      toast.error("Could not remove sample");
    } finally {
      setDeletingSampleId(null);
    }
  };

  const buttons = useMemo(
    () =>
      buildDockButtons({
        slug,
        gearId,
        gearType,
        currentThumbnailUrl,
        currentTopViewUrl,
        locale,
        alternatives,
        hasCreatorVideos,
        managedSamples,
        isManagerOpen,
        setIsManagerOpen,
        deletingSampleId,
        isUploading,
        handleSampleUploadCompletion,
        handleSampleRemoval,
      }),
    [
      alternatives,
      currentThumbnailUrl,
      currentTopViewUrl,
      locale,
      gearId,
      gearType,
      hasCreatorVideos,
      isManagerOpen,
      managedSamples,
      deletingSampleId,
      isUploading,
      rawSamples,
      slug,
      handleSampleUploadCompletion,
      handleSampleRemoval,
    ],
  );

  const isElevated = user && requireRole(user, ["MODERATOR"]);

  if (!isElevated) return null;

  const visibleButtons = buttons.filter((button) => button.allowed(user));

  if (visibleButtons.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 left-1/2 z-40 hidden -translate-x-1/2 transform md:flex">
        <Dock
          className="border-border bg-background/20 group h-12 rounded-full shadow-lg backdrop-blur-lg transition-all"
          direction="middle"
          iconSize={30}
          iconDistance={60}
          // iconMagnification={55}
        >
          {visibleButtons.map((button) => (
            <DockIcon key={button.id}>{button.render()}</DockIcon>
          ))}
        </Dock>
      </div>
    </TooltipProvider>
  );
}
