"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { ScrollBox } from "./scroll-box";
import { ImageSets } from "../data";
import { ScrollItem } from "./scroll-item";
import SensorFormatInput from "~/components/custom-inputs/sensor-format-input";
import { SENSOR_FORMATS } from "~/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { BlurFade } from "~/components/ui/blur-fade";
import { Button } from "~/components/ui/button";

export function FocalLengthClient() {
  const [selectedSetKey, setSelectedSetKey] = useState(ImageSets[0]!.key);
  const [leftActiveIndex, setLeftActiveIndex] = useState(2); // 35mm
  const [rightActiveIndex, setRightActiveIndex] = useState(3); // 50mm
  const [leftSensorFormat, setLeftSensorFormat] = useState<string | undefined>(
    "full-frame",
  );
  const [rightSensorFormat, setRightSensorFormat] = useState<
    string | undefined
  >("full-frame");
  const skipSceneDefaultOnce = useRef(false);
  const copyCooldownRef = useRef<number | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copyingShareLink, setCopyingShareLink] = useState(false);

  const sensorFormatFilter = useMemo(
    () => (format: { crop_factor: string }) => {
      const crop = parseFloat(format.crop_factor);
      return Number.isFinite(crop) && crop >= 1.0;
    },
    [],
  );

  const leftCropFactor = useMemo(() => {
    const match = SENSOR_FORMATS.find((f) => f.slug === leftSensorFormat);
    return match ? parseFloat(match.crop_factor) : null;
  }, [leftSensorFormat]);

  const rightCropFactor = useMemo(() => {
    const match = SENSOR_FORMATS.find((f) => f.slug === rightSensorFormat);
    return match ? parseFloat(match.crop_factor) : null;
  }, [rightSensorFormat]);

  const leftCropLabel = useMemo(() => {
    const match = SENSOR_FORMATS.find((f) => f.slug === leftSensorFormat);
    return match ? `${match.name} (${match.crop_factor}x)` : null;
  }, [leftSensorFormat]);

  const rightCropLabel = useMemo(() => {
    const match = SENSOR_FORMATS.find((f) => f.slug === rightSensorFormat);
    return match ? `${match.name} (${match.crop_factor}x)` : null;
  }, [rightSensorFormat]);

  const selectedSet = useMemo(
    () => ImageSets.find((set) => set.key === selectedSetKey) ?? ImageSets[0]!,
    [selectedSetKey],
  );

  const getIndexForFocalLength = useMemo(
    () => (focal: number) => {
      const idx = selectedSet.images.findIndex(
        (image) => image.focalLengthMm === focal,
      );
      return idx >= 0 ? idx : 0;
    },
    [selectedSet],
  );

  useEffect(() => {
    // Initialize from URL params once (client-only to avoid router re-fetches)
    const params = new URLSearchParams(window.location.search);
    const sceneParam = params.get("scene");
    const lfParam = params.get("lf");
    const rfParam = params.get("rf");
    const lsParam = params.get("ls");
    const rsParam = params.get("rs");

    const nextSet =
      ImageSets.find((set) => set.key === sceneParam) ?? ImageSets[0]!;
    setSelectedSetKey(nextSet.key);

    if (lsParam) setLeftSensorFormat(lsParam);
    if (rsParam) setRightSensorFormat(rsParam);

    const findIndex = (mm?: number | null) => {
      if (!mm) return 0;
      const idx = nextSet.images.findIndex(
        (img) => img.focalLengthMm === Number(mm),
      );
      return idx >= 0 ? idx : 0;
    };

    const lfIdx = lfParam
      ? findIndex(Number(lfParam))
      : getIndexForFocalLength(35);
    const rfIdx = rfParam
      ? findIndex(Number(rfParam))
      : getIndexForFocalLength(50);

    skipSceneDefaultOnce.current = true;
    setLeftActiveIndex(lfIdx);
    setRightActiveIndex(rfIdx);
  }, []);

  useEffect(() => {
    if (skipSceneDefaultOnce.current) {
      skipSceneDefaultOnce.current = false;
      return;
    }
    setLeftActiveIndex(getIndexForFocalLength(35));
    setRightActiveIndex(getIndexForFocalLength(50));
  }, [getIndexForFocalLength]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("scene", selectedSetKey);
    const leftFocal =
      selectedSet.images[leftActiveIndex]?.focalLengthMm?.toString();
    const rightFocal =
      selectedSet.images[rightActiveIndex]?.focalLengthMm?.toString();
    if (leftFocal) params.set("lf", leftFocal);
    if (rightFocal) params.set("rf", rightFocal);
    if (leftSensorFormat) params.set("ls", leftSensorFormat);
    if (rightSensorFormat) params.set("rs", rightSensorFormat);

    const newQuery = params.toString();
    const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", newUrl);
  }, [
    leftActiveIndex,
    rightActiveIndex,
    leftSensorFormat,
    rightSensorFormat,
    selectedSet,
    selectedSetKey,
  ]);

  useEffect(() => {
    return () => {
      if (copyCooldownRef.current !== null) {
        window.clearTimeout(copyCooldownRef.current);
      }
    };
  }, []);

  const handleCopyShareLink = async () => {
    try {
      const copyPromise = navigator.clipboard.writeText(window.location.href);
      setCopyingShareLink(true);
      toast.promise(copyPromise, {
        loading: "Copying link...",
        success: "Copied link",
        error: "Unable to copy link",
      });
      await copyPromise;
      setCopiedShare(true);
      copyCooldownRef.current = window.setTimeout(() => {
        setCopiedShare(false);
        copyCooldownRef.current = null;
        setCopyingShareLink(false);
      }, 750);
    } catch {
      // ignore copy failure; toast already handled
      setCopyingShareLink(false);
    }
  };

  return (
    <div className="mx-auto mt-24 min-h-[calc(100vh-10rem)] max-w-[1600px] space-y-8 px-4 sm:px-8">
      {/* header */}
      <section className="space-y-3 px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold">Focal Length Reference</h1>
            <p className="text-muted-foreground text-sm">
              Pick a scene captured at a known focal length, then explore how
              tighter focal lengths would frame the same scene.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyShareLink}
            loading={copyingShareLink}
            icon={<LinkIcon className="size-4" />}
          >
            Share this Comparison
          </Button>
        </div>
        <div className="flex max-w-xl flex-col gap-2">
          <div className="text-sm font-medium">Scene</div>
          <Select
            value={selectedSetKey}
            onValueChange={(val) => setSelectedSetKey(val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ImageSets.map((set) => (
                <SelectItem key={set.key} value={set.key}>
                  {set.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* image sets */}
      <section>{/* image set selector */}</section>

      {/* 2 columns */}
      <BlurFade direction="up" blur="0px">
        <section className="relative grid h-[calc(100vh-15rem)] auto-rows-fr grid-cols-1 gap-6 px-8 md:grid-cols-2">
          <div className="from-background absolute top-15 right-0 left-0 z-20 h-48 bg-linear-to-b to-transparent"></div>
          {/* left column */}
          <div className="min-h-0 overflow-hidden">
            <div className="flex items-center gap-2">
              <SensorFormatInput
                id="left-sensor-format"
                label="Sensor format"
                value={leftSensorFormat ?? null}
                onChange={(slug) => setLeftSensorFormat(slug)}
                filterFormats={sensorFormatFilter}
                className="w-full"
              />
              <div className="flex w-full flex-col gap-1">
                <div className="text-sm font-medium">Focal length</div>
                <Select
                  value={leftActiveIndex.toString()}
                  onValueChange={(val) => setLeftActiveIndex(Number(val))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSet.images.map((image, index) => (
                      <SelectItem key={image.url} value={index.toString()}>
                        {image.focalLengthMm}mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ScrollBox
              activeIndex={leftActiveIndex}
              onActiveIndexChange={setLeftActiveIndex}
            >
              {selectedSet.images.map((image, index) => (
                <ScrollItem
                  key={image.url}
                  {...image}
                  isActive={leftActiveIndex === index}
                  distanceFromActive={Math.abs(leftActiveIndex - index)}
                  onSelect={() => setLeftActiveIndex(index)}
                  labelPosition="right"
                  overlayTargetFocalLength={
                    selectedSet.images[rightActiveIndex]?.focalLengthMm ?? null
                  }
                  sensorCropFactor={leftCropFactor}
                  sensorCropLabel={leftCropLabel}
                />
              ))}
            </ScrollBox>
          </div>

          {/* right column */}
          <div className="min-h-0 overflow-hidden">
            <div className="flex items-center gap-2">
              <SensorFormatInput
                id="right-sensor-format"
                label="Sensor format"
                value={rightSensorFormat ?? null}
                onChange={(slug) => setRightSensorFormat(slug)}
                filterFormats={sensorFormatFilter}
                className="w-full"
              />
              <div className="flex w-full flex-col gap-1">
                <div className="text-sm font-medium">Focal length</div>
                <Select
                  value={rightActiveIndex.toString()}
                  onValueChange={(val) => setRightActiveIndex(Number(val))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSet.images.map((image, index) => (
                      <SelectItem key={image.url} value={index.toString()}>
                        {image.focalLengthMm}mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ScrollBox
              activeIndex={rightActiveIndex}
              onActiveIndexChange={setRightActiveIndex}
            >
              {selectedSet.images.map((image, index) => (
                <ScrollItem
                  key={image.url}
                  {...image}
                  isActive={rightActiveIndex === index}
                  distanceFromActive={Math.abs(rightActiveIndex - index)}
                  onSelect={() => setRightActiveIndex(index)}
                  overlayTargetFocalLength={
                    selectedSet.images[leftActiveIndex]?.focalLengthMm ?? null
                  }
                  sensorCropFactor={rightCropFactor}
                  sensorCropLabel={rightCropLabel}
                />
              ))}
            </ScrollBox>
          </div>
        </section>
      </BlurFade>
    </div>
  );
}
