"use client";

import { useEffect, useState } from "react";
import { useSession } from "~/lib/auth/auth-client";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  FilePlus,
  ImageIcon,
  Package,
  PackageOpen,
  Swords,
  Trash,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { withBadgeToasts } from "~/components/badges/badge-toast";
import { AddToCompareButton } from "~/components/compare/add-to-compare-button";
import { AddToWishlistButton } from "~/components/gear/add-to-wishlist-button";
import { GearImageModal } from "~/components/modals/gear-image-modal";
import { requireRole } from "~/lib/auth/auth-helpers";
import {
  actionAddGearRawSample,
  actionRemoveGearRawSample,
  actionToggleOwnership,
} from "~/server/gear/actions";
import { AlternativesManager } from "./alternatives-manager";
import { UploadDropzone } from "~/lib/utils/uploadthing";
import type { GearAlternativeRow } from "~/server/gear/service";
import type { RawSample } from "~/types/gear";

interface GearActionButtonsClientProps {
  slug: string;
  gearId?: string;
  gearType: string;
  initialInWishlist?: boolean | null;
  initialIsOwned?: boolean | null;
  currentThumbnailUrl?: string | null;
  currentTopViewUrl?: string | null;
  alternatives?: GearAlternativeRow[];
  rawSamples?: RawSample[];
}

export function GearActionButtonsClient({
  slug,
  gearId,
  gearType,
  initialInWishlist = null,
  initialIsOwned = null,
  currentThumbnailUrl = null,
  currentTopViewUrl = null,
  alternatives = [],
  rawSamples = [],
}: GearActionButtonsClientProps) {
  const { data, isPending, error } = useSession();

  const session = data?.session;
  const user = data?.user;

  const canEditImage = requireRole(user, ["EDITOR"]);
  const canEditAlternatives = requireRole(user, ["EDITOR"]);
  const canManageSamples = requireRole(user, ["ADMIN", "SUPERADMIN"]) && gearType === "CAMERA";
  const [isOwned, setIsOwned] = useState<boolean | null>(initialIsOwned);
  const [loading, setLoading] = useState({
    ownership: false,
  });
  const [managedSamples, setManagedSamples] = useState<RawSample[]>(rawSamples);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [deletingSampleId, setDeletingSampleId] = useState<string | null>(null);

  useEffect(() => {
    setManagedSamples(rawSamples);
  }, [rawSamples]);

  const handleSampleUploadCompletion = async (items?: unknown[]) => {
    if (managedSamples.length >= 3) {
      toast.error("Only three samples are allowed per gear item.");
      return;
    }
    if (!items?.length) return;
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
        setManagedSamples((prev) => [...prev, newSample]);
        toast.success("Sample uploaded");
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload sample";
      toast.error(message);
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

  // Initial state comes from the server wrapper props; no client fetch

  const handleOwnershipToggle = async () => {
    if (!session || isOwned === null) return;

    setLoading((prev) => ({ ...prev, ownership: true }));
    try {
      const action = isOwned ? "remove" : ("add" as const);
      const res = await withBadgeToasts(actionToggleOwnership(slug, action));
      if (res.ok) {
        setIsOwned(!isOwned);

        // Optimistic stats update event
        const delta = res.action === "added" ? 1 : -1;
        window.dispatchEvent(
          new CustomEvent("gear:ownership", { detail: { delta, slug } }),
        );

        if (res.action === "added") {
          toast.success("Added to collection");
        } else {
          toast.success("Removed from collection");
        }
      } else {
        toast.error("Failed to update collection");
      }
    } catch (error) {
      toast.error("Failed to update collection");
    } finally {
      setLoading((prev) => ({ ...prev, ownership: false }));
    }
  };

  // Loading skeleton before auth status resolved (only when session unknown)
  if (isPending && !session) {
    return (
      <div className="space-y-3 pt-4">
        <div className="bg-muted h-10 animate-pulse rounded-md" />
        <div className="bg-muted h-10 animate-pulse rounded-md" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="pt-4">
        <Button variant="outline" className="w-full" disabled>
          Sign in to interact with gear
        </Button>
      </div>
    );
  }

  const ownedActive = isOwned === true;

  return (
    <div className="space-y-3 pt-4">
      {/* Wishlist Button */}
      <AddToWishlistButton
        slug={slug}
        initialInWishlist={initialInWishlist}
        size="md"
        variant="outline"
        fullWidth
        showLabel
      />

      {/* Ownership Button */}
      <Button
        variant={!ownedActive ? "outline" : "default"}
        className="w-full"
        onClick={handleOwnershipToggle}
        loading={loading.ownership}
        disabled={isOwned === null}
        icon={ownedActive ? <Package /> : <PackageOpen />}
      >
        {ownedActive ? "Remove from Collection" : "Add to Collection"}
      </Button>

      {/* compare button */}
      <AddToCompareButton
        slug={slug}
        size="md"
        variant="outline"
        className="w-full"
        showLabel
        iconStyle="scaleOnly"
      />

      {/* Profile Link */}
      {/* <Link href={`/u/${session.user.id}`} className="block">
        <Button
          variant="ghost"
          className="w-full"
          icon={<User className="h-4 w-4" />}
        >
          View My Collection
        </Button>
      </Link> */}

      {canEditImage && (
        <GearImageModal
          slug={slug}
          currentThumbnailUrl={currentThumbnailUrl ?? undefined}
          currentTopViewUrl={currentTopViewUrl ?? undefined}
          trigger={
            <Button
              icon={<ImageIcon className="h-4 w-4" />}
              variant="outline"
              className="w-full"
            >
              Manage Images
            </Button>
          }
        />
      )}

      {canEditAlternatives && gearId && (
        <AlternativesManager
          gearId={gearId}
          gearSlug={slug}
          initialAlternatives={alternatives}
          trigger={
            <Button
              icon={<Swords className="h-4 w-4" />}
              variant="outline"
              className="w-full"
            >
              Manage Alternatives
              {alternatives.length > 0 && (
                <span className="bg-muted ml-2 rounded-full px-1.5 py-0.5 text-xs">
                  {alternatives.length}
                </span>
              )}
            </Button>
          }
        />
      )}
      {canManageSamples && (
        <Dialog open={isManagerOpen} onOpenChange={setIsManagerOpen}>
          <DialogTrigger asChild>
            <Button
              icon={<FilePlus className="h-4 w-4" />}
              variant="outline"
              className="w-full"
            >
              Manage Samples
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Raw Sample Archive</DialogTitle>
              <DialogDescription>
                Upload and remove downloadable raw files for this gear item.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="border-border text-muted-foreground space-y-2 rounded-md border border-dashed p-4 text-sm">
                {managedSamples.length >= 3 ? (
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <p className="text-muted-foreground text-xs">
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
                        toast.error(message);
                      }}
                    />
                  </>
                )}
              </div>

              <div className="space-y-3">
                {managedSamples.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
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
                            <p className="text-muted-foreground text-xs">
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
                              disabled={deletingSampleId === sample.id}
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
      )}
    </div>
  );
}
