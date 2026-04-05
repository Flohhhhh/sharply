"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSession } from "~/lib/auth/auth-client";
import { requireRole } from "~/lib/auth/auth-helpers";
import { toast } from "sonner";
import {
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  Video,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  actionCreateGearCreatorVideo,
  actionDeactivateGearCreatorVideo,
  actionUpdateGearCreatorVideoEditorialNote,
} from "~/server/creator-videos/actions";
import type { CreatorVideoMetadataResolution } from "~/server/creator-videos/metadata";

type ManageCreatorVideosModalProps = {
  slug: string;
  trigger?: React.ReactNode;
};

type ManageDataResponse = {
  videos: Array<{
    id: string;
    sourceUrl: string;
    normalizedUrl: string;
    title: string;
    thumbnailUrl: string | null;
    publishedAt: string | null;
    editorNote: string | null;
    creator: {
      id: string;
      name: string;
      channelUrl: string;
      avatarUrl: string | null;
      isActive: boolean;
    };
  }>;
  creators: Array<{
    id: string;
    name: string;
    platform: "YOUTUBE";
    channelUrl: string;
    avatarUrl: string | null;
    isActive: boolean;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ManageCreatorVideosModal({
  slug,
  trigger,
}: ManageCreatorVideosModalProps) {
  const { data, isPending: isSessionPending, error } = useSession();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ManageDataResponse | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState("");
  const [editorNote, setEditorNote] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualThumbnailUrl, setManualThumbnailUrl] = useState("");
  const [manualPublishedAt, setManualPublishedAt] = useState("");
  const [resolution, setResolution] =
    useState<CreatorVideoMetadataResolution | null>(null);
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [isMutating, startTransition] = useTransition();

  const canManage = useMemo(() => {
    if (!data?.user) return false;
    return requireRole(data.user, ["EDITOR"]);
  }, [data]);

  async function loadManageData() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(`/api/gear/${slug}/creator-videos/manage-data`, {
        method: "GET",
      });
      const body = (await response.json()) as ManageDataResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Failed to load creator videos");
      }

      setPayload(body);
      setNoteDrafts(
        Object.fromEntries(
          body.videos.map((video) => [video.id, video.editorNote ?? ""]),
        ),
      );
    } catch (loadError) {
      setLoadError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load creator videos",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function resetManualOverrides() {
    setManualTitle("");
    setManualThumbnailUrl("");
    setManualPublishedAt("");
  }

  function resetResolvedVideoState() {
    resetManualOverrides();
    setResolution(null);
    setResolutionError(null);
  }

  function resetAddForm() {
    setSelectedCreatorId("");
    setVideoUrl("");
    setEditorNote("");
    resetResolvedVideoState();
  }

  useEffect(() => {
    if (!open || !canManage) return;
    void loadManageData();
  }, [open, canManage, slug]);

  useEffect(() => {
    resetResolvedVideoState();
  }, [selectedCreatorId, videoUrl]);

  if (!data || isSessionPending || error || !canManage) {
    return null;
  }

  async function handleResolve() {
    if (!selectedCreatorId) {
      setResolutionError("Select an approved creator first");
      return;
    }

    if (!videoUrl.trim()) {
      setResolutionError("Paste a YouTube video URL to continue");
      return;
    }

    setIsResolving(true);
    resetResolvedVideoState();

    try {
      const response = await fetch("/api/gear/creator-videos/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorId: selectedCreatorId,
          url: videoUrl,
        }),
      });
      const body = (await response.json()) as {
        resolution?: CreatorVideoMetadataResolution;
        error?: string;
      };

      if (!response.ok || !body.resolution) {
        throw new Error(body.error ?? "Failed to resolve video");
      }

      setResolution(body.resolution);
      if (body.resolution.metadataStatus === "manual_required") {
        setManualThumbnailUrl(body.resolution.thumbnailUrl ?? "");
      }
    } catch (resolveError) {
      setResolution(null);
      setResolutionError(
        resolveError instanceof Error
          ? resolveError.message
          : "Failed to resolve video",
      );
    } finally {
      setIsResolving(false);
    }
  }

  function handleAddVideo() {
    if (!resolution) {
      setResolutionError("Fetch the video details before saving");
      return;
    }

    startTransition(async () => {
      try {
        await actionCreateGearCreatorVideo(slug, {
          creatorId: selectedCreatorId,
          url: videoUrl,
          title: manualTitle,
          thumbnailUrl: manualThumbnailUrl,
          publishedAt: manualPublishedAt,
          editorNote,
          resolution,
        });
        toast.success("Creator video saved");
        resetAddForm();
        await loadManageData();
      } catch (saveError) {
        toast.error(
          saveError instanceof Error
            ? saveError.message
            : "Failed to save creator video",
        );
      }
    });
  }

  function handleSaveNote(videoId: string) {
    startTransition(async () => {
      try {
        await actionUpdateGearCreatorVideoEditorialNote(slug, videoId, {
          editorNote: noteDrafts[videoId] ?? "",
        });
        toast.success("Editorial note saved");
        await loadManageData();
      } catch (saveError) {
        toast.error(
          saveError instanceof Error
            ? saveError.message
            : "Failed to save editorial note",
        );
      }
    });
  }

  function handleRemove(videoId: string) {
    startTransition(async () => {
      try {
        await actionDeactivateGearCreatorVideo(slug, videoId);
        toast.success("Creator video removed");
        await loadManageData();
      } catch (removeError) {
        toast.error(
          removeError instanceof Error
            ? removeError.message
            : "Failed to remove creator video",
        );
      }
    });
  }

  const activeCreators = payload?.creators ?? [];
  const attachedVideos = payload?.videos ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetAddForm();
          setLoadError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Pencil className="size-4" />
            Manage Creator Videos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Creator Videos</DialogTitle>
          <DialogDescription>
            Attach curated videos from approved creators that help show real use,
            technical behavior, impressions, or narrative coverage for this item.
          </DialogDescription>
        </DialogHeader>

        {isLoading && !payload ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading creator videos...
          </div>
        ) : loadError ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
            <div>{loadError}</div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadManageData()}
              className="mt-3"
            >
              <RefreshCcw className="size-4" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {attachedVideos.length > 0 ? (
              <section className="space-y-3">
                <div className="space-y-3">
                  {attachedVideos.map((video) => {
                    const publishedLabel = formatDate(video.publishedAt);
                    const noteValue = noteDrafts[video.id] ?? "";
                    return (
                      <div
                        key={video.id}
                        className="rounded-2xl border bg-white/70 p-3 shadow-sm dark:bg-zinc-950/30"
                      >
                        <div className="flex flex-col gap-4 md:flex-row">
                          <div className="overflow-hidden rounded-xl border bg-zinc-100 md:w-52 dark:bg-zinc-900">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="aspect-video h-full w-full object-cover"
                              />
                            ) : (
                              <div className="text-muted-foreground flex aspect-video items-center justify-center text-sm">
                                No thumbnail
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary">YouTube</Badge>
                                  {!video.creator.isActive ? (
                                    <Badge variant="outline">Creator inactive</Badge>
                                  ) : null}
                                  {publishedLabel ? (
                                    <span className="text-muted-foreground text-xs">
                                      {publishedLabel}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="line-clamp-2 text-base font-semibold">
                                  {video.title}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Avatar className="size-6 border">
                                    <AvatarImage
                                      src={video.creator.avatarUrl ?? undefined}
                                      alt={video.creator.name}
                                    />
                                    <AvatarFallback className="text-[10px]">
                                      {getInitials(video.creator.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-muted-foreground">
                                    {video.creator.name}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <a
                                    href={video.normalizedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <ExternalLink className="size-4" />
                                    Watch
                                  </a>
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemove(video.id)}
                                  disabled={isMutating}
                                >
                                  <Trash2 className="size-4" />
                                  Remove
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`note-${video.id}`}>
                                Internal note
                              </Label>
                              <Textarea
                                id={`note-${video.id}`}
                                value={noteValue}
                                onChange={(event) =>
                                  setNoteDrafts((current) => ({
                                    ...current,
                                    [video.id]: event.target.value,
                                  }))
                                }
                                rows={3}
                                placeholder="Internal only, not shown publicly"
                              />
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSaveNote(video.id)}
                                  disabled={isMutating}
                                >
                                  Save Note
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {attachedVideos.length > 0 ? <Separator /> : null}

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold tracking-wide uppercase">
                  Add Video
                </h3>
                <p className="text-muted-foreground text-sm">
                  Choose an approved creator, paste the YouTube URL, fetch the
                  metadata, then confirm the attached record.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="creator-video-creator">Approved creator</Label>
                  <Select
                    value={selectedCreatorId}
                    onValueChange={setSelectedCreatorId}
                  >
                    <SelectTrigger id="creator-video-creator">
                      <SelectValue placeholder="Select a creator" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCreators.map((creator) => (
                        <SelectItem key={creator.id} value={creator.id}>
                          {creator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creator-video-url">YouTube URL</Label>
                  <Input
                    id="creator-video-url"
                    value={videoUrl}
                    onChange={(event) => setVideoUrl(event.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleResolve()}
                  disabled={isResolving || isMutating}
                >
                  {isResolving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Video className="size-4" />
                  )}
                  Fetch Video Details
                </Button>
                {resolutionError ? (
                  <span className="text-sm text-red-600 dark:text-red-300">
                    {resolutionError}
                  </span>
                ) : null}
              </div>

              {resolution ? (
                <div className="space-y-4 rounded-2xl border bg-zinc-50/80 p-4 dark:bg-zinc-950/40">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="overflow-hidden rounded-xl border bg-zinc-100 md:w-56 dark:bg-zinc-900">
                      {resolution.thumbnailUrl ? (
                        <img
                          src={resolution.thumbnailUrl}
                          alt={resolution.title ?? "Resolved video preview"}
                          className="aspect-video h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-muted-foreground flex aspect-video items-center justify-center text-sm">
                          No thumbnail
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">YouTube</Badge>
                        <Badge
                          variant={
                            resolution.metadataStatus === "resolved"
                              ? "default"
                              : "outline"
                          }
                        >
                          {resolution.metadataStatus === "resolved"
                            ? "Metadata fetched"
                            : "Manual title required"}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="line-clamp-2 text-base font-semibold">
                          {resolution.title ?? "Title will be entered manually"}
                        </div>
                        <div className="text-muted-foreground break-all text-xs">
                          {resolution.normalizedUrl}
                        </div>
                      </div>
                    </div>
                  </div>

                  {resolution.metadataStatus === "manual_required" ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="creator-video-manual-title">
                          Video title
                        </Label>
                        <Input
                          id="creator-video-manual-title"
                          value={manualTitle}
                          onChange={(event) => setManualTitle(event.target.value)}
                          placeholder="Required when automatic title lookup fails"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="creator-video-manual-thumbnail">
                          Thumbnail URL
                        </Label>
                        <Input
                          id="creator-video-manual-thumbnail"
                          value={manualThumbnailUrl}
                          onChange={(event) =>
                            setManualThumbnailUrl(event.target.value)
                          }
                          placeholder="Optional"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="creator-video-published-at">
                          Publish date
                        </Label>
                        <Input
                          id="creator-video-published-at"
                          type="date"
                          value={manualPublishedAt}
                          onChange={(event) =>
                            setManualPublishedAt(event.target.value)
                          }
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="creator-video-editor-note">
                      Internal note
                    </Label>
                    <Textarea
                      id="creator-video-editor-note"
                      value={editorNote}
                      onChange={(event) => setEditorNote(event.target.value)}
                      rows={3}
                      placeholder="Internal only, not shown publicly"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleAddVideo}
                      disabled={isMutating || isResolving}
                    >
                      <Plus className="size-4" />
                      Save Video
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
