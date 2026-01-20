import Link from "next/link";
import {
  FilePlus,
  ImageIcon,
  Pencil,
  Swords,
  Trash,
  Upload,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { GearImageModal } from "~/components/modals/gear-image-modal";
import { requireRole } from "~/lib/auth/auth-helpers";
import { UploadDropzone } from "~/lib/utils/uploadthing";
import type { GearAlternativeRow } from "~/server/gear/service";
import type { RawSample } from "~/types/gear";
import { AlternativesManager } from "~/app/(app)/(pages)/gear/_components/alternatives-manager";
import type { AuthUser } from "~/auth";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/components/ui/tooltip";

type DockSample = Omit<RawSample, "createdAt" | "updatedAt"> & {
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type DockButtonConfig = {
  id: string;
  allowed: (user: AuthUser | null | undefined) => boolean;
  render: () => React.ReactNode;
};

export interface BuildDockButtonsParams {
  slug: string;
  gearId?: string;
  gearType: string;
  currentThumbnailUrl?: string | null;
  currentTopViewUrl?: string | null;
  alternatives: GearAlternativeRow[];
  managedSamples: DockSample[];
  isManagerOpen: boolean;
  setIsManagerOpen: (value: boolean) => void;
  deletingSampleId: string | null;
  isUploading: boolean;
  handleSampleUploadCompletion: (items?: unknown[]) => Promise<void>;
  handleSampleRemoval: (sampleId: string) => Promise<void>;
}

const MAX_SAMPLES = 3;
const baseTriggerClass =
  "hover:bg-accent/80 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:cursor-pointer hover:border hover:bg-accent/80 ";

export function buildDockButtons({
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
}: BuildDockButtonsParams): DockButtonConfig[] {
  return [
    {
      id: "edit specs",
      allowed: (currentUser) => Boolean(requireRole(currentUser, ["EDITOR"])),
      render: () => (
        <Tooltip key="edit specs">
          <TooltipTrigger asChild>
            <Link
              href={`/gear/${slug}/edit`}
              className={baseTriggerClass}
              scroll={false}
            >
              <Pencil className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent sideOffset={10}>Edit Specs</TooltipContent>
        </Tooltip>
      ),
    },
    {
      id: "images",
      allowed: (currentUser) => Boolean(requireRole(currentUser, ["EDITOR"])),
      render: () => (
        <Tooltip key="images">
          <GearImageModal
            slug={slug}
            currentThumbnailUrl={currentThumbnailUrl ?? undefined}
            currentTopViewUrl={currentTopViewUrl ?? undefined}
            trigger={
              <TooltipTrigger asChild>
                <button className={baseTriggerClass} aria-label="Manage Images">
                  <ImageIcon className="h-5 w-5" />
                </button>
              </TooltipTrigger>
            }
          />
          <TooltipContent sideOffset={10}>Gear Images</TooltipContent>
        </Tooltip>
      ),
    },
    {
      id: "alternatives",
      allowed: (currentUser) =>
        Boolean(gearId && requireRole(currentUser, ["EDITOR"])),
      render: () =>
        gearId ? (
          <Tooltip key="alternatives">
            <AlternativesManager
              gearId={gearId}
              gearSlug={slug}
              gearType={gearType}
              initialAlternatives={alternatives}
              trigger={
                <TooltipTrigger asChild>
                  <button
                    className={baseTriggerClass}
                    aria-label="Manage Alternatives"
                  >
                    <Swords className="h-5 w-5" />
                    {/* {alternatives.length > 0 ? (
                  <span className="bg-primary absolute -top-1 -right-1 rounded-full px-1.5 text-[10px] font-semibold text-white">
                    {alternatives.length}
                  </span>
                ) : null} */}
                  </button>
                </TooltipTrigger>
              }
            />
            <TooltipContent sideOffset={10}>Alternatives</TooltipContent>
          </Tooltip>
        ) : null,
    },
    {
      id: "samples",
      allowed: (currentUser) =>
        Boolean(
          gearType === "CAMERA" &&
          requireRole(currentUser, ["ADMIN", "SUPERADMIN"]),
        ),
      render: () => (
        <Dialog open={isManagerOpen} onOpenChange={setIsManagerOpen}>
          <Tooltip key="samples">
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <button
                  className={baseTriggerClass}
                  aria-label="Manage Samples"
                >
                  <FilePlus className="h-5 w-5" />
                </button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent sideOffset={10}>Raw Samples</TooltipContent>
          </Tooltip>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Raw Sample Archive</DialogTitle>
              <DialogDescription>
                Upload and remove downloadable raw files for this gear item.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="border-border space-y-2 rounded-md border border-dashed p-4 text-sm">
                {managedSamples.length >= MAX_SAMPLES ? (
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <p className="text-xs">
                      Maximum of three samples reached. Remove one to upload
                      another.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>Drop a file or click to upload</span>
                    </div>
                    <UploadDropzone
                      endpoint="rawSampleUploader"
                      onClientUploadComplete={handleSampleUploadCompletion}
                      onUploadError={(uploadError) => {
                        const message =
                          uploadError instanceof Error
                            ? uploadError.message
                            : "Upload failed";
                        console.error(message);
                      }}
                      disabled={isUploading}
                    />
                  </>
                )}
              </div>

              <div className="space-y-3">
                {managedSamples.length === 0 ? (
                  <p className="text-sm">
                    No samples yet. Upload a file to make it available.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {managedSamples.map((sample) => {
                      const displayName =
                        sample.originalFilename ?? sample.fileUrl;
                      const timestamp = sample.createdAt ?? sample.updatedAt;
                      return (
                        <li
                          key={sample.id}
                          className="flex items-center justify-between gap-3 rounded-md border p-2"
                        >
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">{displayName}</p>
                            <p className="text-xs">
                              {timestamp
                                ? new Date(timestamp).toLocaleString()
                                : "Unknown date"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={sample.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary text-xs underline"
                            >
                              View
                            </Link>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              disabled={
                                deletingSampleId === sample.id || isUploading
                              }
                              onClick={() => handleSampleRemoval(sample.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ),
    },
  ];
}
