"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Dock, DockIcon } from "~/components/ui/dock";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { requireRole } from "~/lib/auth/auth-helpers";
import { useSession } from "~/lib/auth/auth-client";
import type { GearAlternativeRow } from "~/server/gear/service";
import type { RawSample } from "~/types/gear";
import {
  actionAddGearRawSample,
  actionRemoveGearRawSample,
} from "~/server/gear/actions";
import { buildDockButtons } from "./dock-buttons";

interface GearItemDockClientProps {
  slug: string;
  gearId?: string;
  gearType: string;
  currentThumbnailUrl?: string | null;
  currentTopViewUrl?: string | null;
  alternatives?: GearAlternativeRow[];
  rawSamples?: RawSample[];
}

type ManagedSampleState = Omit<RawSample, "createdAt" | "updatedAt"> & {
  createdAt?: string | null;
  updatedAt?: string | null;
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
}: GearItemDockClientProps) {
  const { data, isPending } = useSession();
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
      for (const item of items as any[]) {
        const fileUrl =
          (item?.serverData?.fileUrl as string | undefined) ??
          (item?.url as string | undefined) ??
          (item?.ufsUrl as string | undefined) ??
          "";
        if (!fileUrl) continue;
        const originalFilename =
          (item?.serverData?.fileName as string | undefined) ??
          (item?.fileName as string | undefined) ??
          (item?.name as string | undefined) ??
          fileUrl.split("/").pop() ??
          "sample";
        const contentType =
          (item?.serverData?.contentType as string | undefined) ??
          (item?.mimeType as string | undefined) ??
          (item?.type as string | undefined) ??
          null;
        const sizeBytes =
          typeof item?.size === "number"
            ? item.size
            : typeof item?.serverData?.size === "number"
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
    } catch (error) {
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
        alternatives,
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
      gearId,
      gearType,
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
