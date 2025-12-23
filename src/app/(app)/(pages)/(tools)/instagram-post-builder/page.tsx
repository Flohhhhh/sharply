"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Download,
  Image as ImageIcon,
  Layers,
  PanelLeft,
  Plus,
  Scissors,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import JSZip from "jszip";
import { useIsMobile } from "@/hooks/use-mobile";

type FrameImage = {
  id: number;
  src: string;
  width: number;
  height: number;
  position: { x: number; y: number };
};

type Frame = {
  id: number;
  images: FrameImage[];
};

type Settings = {
  aspectRatio: number;
  padding: number;
  bgColor: string;
  peekAmount: number;
  showGuides: boolean;
};

type DragState = {
  isDragging: boolean;
  frameId: number | null;
  imageId: number | null;
  startX: number;
  startY: number;
  initialPosX: number;
  initialPosY: number;
};

type FrameRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const FRAME_WIDTH = 1080;
const DEFAULT_SETTINGS: Settings = {
  aspectRatio: 4 / 5,
  padding: 16,
  bgColor: "#FFFFFF",
  peekAmount: 110,
  showGuides: true,
};

const ASPECT_RATIOS = [
  { label: "4:5", value: 4 / 5 },
  { label: "1:1", value: 1 },
  { label: "9:16", value: 9 / 16 },
  { label: "16:9", value: 16 / 9 },
];

const COLORS = ["#FFFFFF", "#000000"];

const getFrameRect = (
  index: number,
  totalFrames: number,
  settings: Settings,
): FrameRect => {
  const { padding, peekAmount, aspectRatio } = settings;
  const totalHeight = FRAME_WIDTH / aspectRatio;

  let leftBoundary = index * FRAME_WIDTH;
  if (index === 1) {
    leftBoundary -= peekAmount;
  }

  let rightBoundary = (index + 1) * FRAME_WIDTH;
  if (index === 0 && totalFrames > 1) {
    rightBoundary -= peekAmount;
  }

  const hasPeek = peekAmount > 0;
  let paddingLeft = padding;
  let paddingRight = padding;

  if (hasPeek && index === 1 && totalFrames > 1) {
    paddingLeft = padding / 2;
  }

  if (hasPeek && index === 0 && totalFrames > 1) {
    paddingRight = padding / 2;
  }

  const x = leftBoundary + paddingLeft;
  const width = rightBoundary - leftBoundary - paddingLeft - paddingRight;

  return {
    x,
    y: padding,
    w: Math.max(0, width),
    h: totalHeight - padding * 2,
  };
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const getNextFrameId = (frames: Frame[]) =>
  frames.length === 0 ? 1 : Math.max(...frames.map((frame) => frame.id)) + 1;

const InstagramPostBuilderPage = () => {
  const isMobile = useIsMobile();
  const [frames, setFrames] = useState<Frame[]>([{ id: 1, images: [] }]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [activeFrameId, setActiveFrameId] = useState<number | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    frameId: null,
    imageId: null,
    startX: 0,
    startY: 0,
    initialPosX: 50,
    initialPosY: 50,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetFrameRef = useRef<number | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [workspaceHeight, setWorkspaceHeight] = useState(0);

  const totalWidth = useMemo(
    () => frames.length * FRAME_WIDTH,
    [frames.length],
  );
  const totalHeight = useMemo(
    () => FRAME_WIDTH / settings.aspectRatio,
    [settings.aspectRatio],
  );

  useEffect(() => {
    const element = workspaceRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWorkspaceHeight(entry.contentRect.height);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const canvasHeight = useMemo(() => {
    if (!workspaceHeight) {
      return null;
    }
    const paddingAllowance = 48;
    return Math.max(workspaceHeight - paddingAllowance, 320);
  }, [workspaceHeight]);

  const renderHeight = useMemo(() => {
    if (!canvasHeight) {
      return null;
    }
    return Math.max(canvasHeight * 0.7, 260);
  }, [canvasHeight]);

  const addFrame = () => {
    const newId = getNextFrameId(frames);
    setFrames((prev) => [...prev, { id: newId, images: [] }]);
  };

  const removeFrame = (frameId: number) => {
    setFrames((prev) => {
      if (prev.length === 1) {
        return [{ id: 1, images: [] }];
      }
      const nextFrames = prev.filter((frame) => frame.id !== frameId);
      if (activeFrameId === frameId) {
        setActiveFrameId(null);
      }
      return nextFrames;
    });
  };

  const triggerUpload = (frameId: number) => {
    targetFrameRef.current = frameId;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const deleteImage = (frameId: number, imageId: number) => {
    setFrames((prev) =>
      prev.map((frame) =>
        frame.id === frameId
          ? {
              ...frame,
              images: frame.images.filter((image) => image.id !== imageId),
            }
          : frame,
      ),
    );
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const targetFrame = targetFrameRef.current ?? frames[0]?.id;
    if (!targetFrame) {
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const toDataPromises = Array.from(files).map(
      (file) =>
        new Promise<FrameImage>((resolve) => {
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = () => {
              resolve({
                id: Number(`${Date.now()}${Math.random()}`),
                src: readerEvent.target?.result as string,
                width: img.width,
                height: img.height,
                position: { x: 50, y: 50 },
              });
            };
            img.src = readerEvent.target?.result as string;
          };
          reader.readAsDataURL(file);
        }),
    );

    const newImages = await Promise.all(toDataPromises);
    setFrames((prev) =>
      prev.map((frame) =>
        frame.id === targetFrame
          ? { ...frame, images: [...frame.images, ...newImages] }
          : frame,
      ),
    );
    setActiveFrameId(targetFrame);
  };

  const handleMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
    frameId: number,
    imageId: number,
    currentPos: { x: number; y: number },
  ) => {
    event.preventDefault();
    setDragState({
      isDragging: true,
      frameId,
      imageId,
      startX: event.clientX,
      startY: event.clientY,
      initialPosX: currentPos.x,
      initialPosY: currentPos.y,
    });
    setActiveFrameId(frameId);
  };

  useEffect(() => {
    if (!dragState.isDragging) {
      return;
    }

    const handleMove = (event: MouseEvent) => {
      if (!dragState.isDragging) {
        return;
      }
      const sensitivity = 0.05;
      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      const nextX = Math.max(
        0,
        Math.min(100, dragState.initialPosX - deltaX * sensitivity),
      );
      const nextY = Math.max(
        0,
        Math.min(100, dragState.initialPosY - deltaY * sensitivity),
      );

      setFrames((prev) =>
        prev.map((frame) =>
          frame.id === dragState.frameId
            ? {
                ...frame,
                images: frame.images.map((image) =>
                  image.id === dragState.imageId
                    ? { ...image, position: { x: nextX, y: nextY } }
                    : image,
                ),
              }
            : frame,
        ),
      );
    };

    const handleUp = () => {
      setDragState((prev) => ({ ...prev, isDragging: false }));
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragState]);

  const generateCanvas = async (mode: "single" | "all") => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return [];
    }

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    ctx.fillStyle = settings.bgColor;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    for (const [frameIndex, frame] of frames.entries()) {
      const rect = getFrameRect(frameIndex, frames.length, settings);

      if (frame.images.length === 0) {
        continue;
      }

      const segmentHeight = rect.h / frame.images.length;

      for (const [imageIndex, imageData] of frame.images.entries()) {
        const image = await loadImage(imageData.src);

        const clipY = rect.y + segmentHeight * imageIndex;
        const clipW = rect.w;
        const clipH = segmentHeight;

        const imageRatio = image.width / image.height;
        const boxRatio = clipW / clipH;

        let renderWidth: number;
        let renderHeight: number;
        let renderX: number;
        let renderY: number;

        if (imageRatio > boxRatio) {
          renderHeight = clipH;
          renderWidth = renderHeight * imageRatio;
          renderY = clipY;
          renderX =
            rect.x + (clipW - renderWidth) * (imageData.position.x / 100);
        } else {
          renderWidth = clipW;
          renderHeight = renderWidth / imageRatio;
          renderX = rect.x;
          renderY =
            clipY + (clipH - renderHeight) * (imageData.position.y / 100);
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, clipY, clipW, clipH);
        ctx.clip();
        ctx.drawImage(image, renderX, renderY, renderWidth, renderHeight);
        ctx.restore();
      }
    }

    if (mode === "single") {
      return [];
    }

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = FRAME_WIDTH;
    exportCanvas.height = totalHeight;
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) {
      return [];
    }

    const slices: Array<{ id: number; url: string }> = [];
    for (const [frameIndex, frame] of frames.entries()) {
      exportCtx.clearRect(0, 0, FRAME_WIDTH, totalHeight);
      exportCtx.drawImage(
        canvas,
        frameIndex * FRAME_WIDTH,
        0,
        FRAME_WIDTH,
        totalHeight,
        0,
        0,
        FRAME_WIDTH,
        totalHeight,
      );
      const url = exportCanvas.toDataURL("image/jpeg", 0.95);
      slices.push({ id: frame.id, url });
    }

    return slices;
  };

  const handleExport = async () => {
    const slices = await generateCanvas("all");
    if (slices.length === 0) {
      return;
    }

    const zip = new JSZip();
    await Promise.all(
      slices.map(async (slice) => {
        const blob = await dataUrlToBlob(slice.url);
        zip.file(`frame-${slice.id}.jpg`, blob);
      }),
    );

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const objectUrl = URL.createObjectURL(zipBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = objectUrl;
    downloadLink.download = `instagram-strip-${Date.now()}.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(objectUrl);
  };

  const renderFrameContent = (frame: Frame) => {
    const tileHeight = 100 / frame.images.length;
    return frame.images.map((image, index) => (
      <div
        key={image.id}
        className="group absolute w-full cursor-move overflow-hidden"
        style={{
          top: `${index * tileHeight}%`,
          height: `${tileHeight}%`,
        }}
        onMouseDown={(event) =>
          handleMouseDown(event, frame.id, image.id, image.position)
        }
      >
        <img
          src={image.src}
          alt="Uploaded media"
          className="pointer-events-none h-full w-full object-cover"
          style={{
            objectPosition: `${image.position.x}% ${image.position.y}%`,
          }}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Remove image"
          className="hover:bg-destructive hover:text-destructive-foreground absolute top-2 right-2 z-20 opacity-0 transition group-hover:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            deleteImage(frame.id, image.id);
          }}
        >
          <X size={12} />
        </Button>
      </div>
    ));
  };

  if (isMobile) {
    return (
      <div className="bg-background text-foreground flex h-screen flex-col items-center justify-center px-6 text-center">
        <div className="max-w-sm space-y-4">
          <h1 className="text-2xl font-semibold">Desktop Only</h1>
          <p className="text-muted-foreground">
            The Instagram post builder is currently optimized for desktop.
            Switch to a larger screen to craft your carousel.
          </p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground flex h-screen flex-col font-sans">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <main className="bg-background mt-16 flex flex-1">
        <section
          className="flex-1 overflow-auto p-10"
          onClick={() => setActiveFrameId(null)}
        >
          <div
            ref={workspaceRef}
            className="flex min-h-full items-center justify-center"
          >
            <div
              className="flex max-w-full items-center gap-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="">
                <div className="p-6">
                  <div
                    className="relative flex min-w-fit flex-shrink-0 items-stretch"
                    style={{
                      height: renderHeight ? `${renderHeight}px` : "55vh",
                      aspectRatio: `${frames.length * settings.aspectRatio}`,
                    }}
                  >
                    <div
                      className="absolute inset-0 transition-colors"
                      style={{ backgroundColor: settings.bgColor }}
                    />

                    {frames.map((frame, index) => {
                      const rect = getFrameRect(index, frames.length, settings);
                      const leftPct = (rect.x / totalWidth) * 100;
                      const topPct = (rect.y / totalHeight) * 100;
                      const widthPct = (rect.w / totalWidth) * 100;
                      const heightPct = (rect.h / totalHeight) * 100;
                      const isActive = activeFrameId === frame.id;

                      return (
                        <div key={frame.id} className="group">
                          {frames.length > 1 && (
                            <div
                              className="border-border bg-background/95 text-foreground absolute z-30 flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow"
                              style={{
                                left: `${leftPct + widthPct / 2}%`,
                                top: `${topPct}%`,
                                transform: "translate(-50%, -140%)",
                              }}
                            >
                              <span>Slide {index + 1}</span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label={`Delete slide ${index + 1}`}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-6 w-6"
                                onClick={() => removeFrame(frame.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          )}

                          <div
                            className={`absolute overflow-hidden transition duration-200 ${
                              isActive ? "ring-primary ring-2" : ""
                            }`}
                            style={{
                              left: `${leftPct}%`,
                              top: `${topPct}%`,
                              width: `${widthPct}%`,
                              height: `${heightPct}%`,
                            }}
                            onClick={() => setActiveFrameId(frame.id)}
                          >
                            {frame.images.length === 0 ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => triggerUpload(frame.id)}
                                className="border-border bg-background text-muted-foreground hover:border-primary/60 hover:text-primary flex h-full w-full items-center justify-center rounded-none border border-dashed transition"
                              >
                                <div className="flex flex-col items-center gap-2 text-sm font-medium">
                                  <ImageIcon size={20} />
                                  Add Images
                                </div>
                              </Button>
                            ) : (
                              renderFrameContent(frame)
                            )}
                          </div>

                          {isActive && (
                            <div
                              className="absolute z-20 flex flex-col gap-2"
                              style={{
                                left: `${leftPct + widthPct / 2}%`,
                                top: `${topPct + heightPct}%`,
                                transform: "translate(-50%, 12px)",
                              }}
                            >
                              <div className="border-border bg-popover/80 flex items-center gap-2 rounded-lg border p-1.5 shadow-lg">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => triggerUpload(frame.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Layers size={14} /> Add Image
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {settings.showGuides &&
                      Array.from({
                        length: Math.max(frames.length - 1, 0),
                      }).map((_, index) => (
                        <div
                          key={`guide-${index}`}
                          className="border-primary/60 pointer-events-none absolute inset-y-0 border-l border-dashed"
                          style={{
                            left: `${((index + 1) / frames.length) * 100}%`,
                          }}
                        >
                          <div className="bg-primary text-primary-foreground absolute bottom-2 left-1 rounded px-1 py-0.5 font-mono text-[10px]">
                            CUT {index + 1}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addFrame}
                className="border-border bg-card text-muted-foreground hover:border-muted hover:bg-muted flex w-12 flex-shrink-0 items-center justify-center rounded-lg border border-dashed transition"
                style={{ height: renderHeight ? `${renderHeight}px` : "55vh" }}
              >
                <Plus />
              </Button>
              {/* just a space filler since padding is unavailable */}
              <div className="h-2 w-36">
                <span className="text-background">.</span>
              </div>
            </div>
          </div>
        </section>

        <aside className="border-border bg-card flex w-80 flex-shrink-0 flex-col border-l px-6 py-8">
          <div className="sticky top-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Controls
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download size={14} /> Export All
              </Button>
            </div>

            <div className="flex flex-col gap-6">
              <section>
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Aspect Ratio
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <Button
                      key={ratio.label}
                      type="button"
                      size="sm"
                      variant={
                        settings.aspectRatio === ratio.value
                          ? "default"
                          : "secondary"
                      }
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          aspectRatio: ratio.value,
                        }))
                      }
                    >
                      {ratio.label}
                    </Button>
                  ))}
                </div>
              </section>

              <section>
                <div className="text-muted-foreground flex items-center justify-between text-xs font-semibold tracking-wide uppercase">
                  <span>Padding</span>
                  <span>{settings.padding}px</span>
                </div>
                <Slider
                  min={0}
                  max={150}
                  value={[settings.padding]}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      padding: value[0] ?? prev.padding,
                    }))
                  }
                  className="mt-2"
                />
              </section>

              <section>
                <div className="text-muted-foreground flex items-center justify-between text-xs font-semibold tracking-wide uppercase">
                  <span className="flex items-center gap-1">
                    <PanelLeft size={12} />
                    Peek Offset
                  </span>
                  <span>{settings.peekAmount}px</span>
                </div>
                <Slider
                  min={0}
                  max={200}
                  value={[settings.peekAmount]}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      peekAmount: value[0] ?? prev.peekAmount,
                    }))
                  }
                  className="mt-2"
                />
              </section>

              <section>
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Background Color
                </h3>
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {COLORS.map((color) => (
                    <Button
                      key={color}
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setSettings((prev) => ({ ...prev, bgColor: color }))
                      }
                      className={`border-border h-7 w-7 rounded-full border p-0 transition ${
                        settings.bgColor === color ? "ring-ring ring-1" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </section>

              <section className="flex items-center justify-between">
                <div>
                  <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    Guides
                  </h3>
                  <p className="text-muted-foreground text-[10px]">
                    Show Instagram cut markers
                  </p>
                </div>
                <Button
                  type="button"
                  variant={settings.showGuides ? "default" : "secondary"}
                  size="icon"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      showGuides: !prev.showGuides,
                    }))
                  }
                  className="rounded-lg p-2"
                >
                  <Scissors size={16} />
                </Button>
              </section>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default InstagramPostBuilderPage;
