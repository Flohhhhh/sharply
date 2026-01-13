"use client";

import { LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState } from "react";

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
import { Button } from "~/components/ui/button";

export function FocalLengthClientMobile() {
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
  }, [getIndexForFocalLength]);

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

    // Keep URL aligned to the desktop format (two focal length entries).
    const fallbackRightIndex = getIndexForFocalLength(50);
    const safeRightIndex = Math.min(
      Math.max(rightActiveIndex, 0),
      Math.max(selectedSet.images.length - 1, 0),
    );
    if (safeRightIndex !== rightActiveIndex) {
      setRightActiveIndex(safeRightIndex);
    }

    const leftFocal =
      selectedSet.images[leftActiveIndex]?.focalLengthMm?.toString();
    const rightFocal =
      selectedSet.images[safeRightIndex]?.focalLengthMm?.toString() ??
      selectedSet.images[fallbackRightIndex]?.focalLengthMm?.toString();
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
        setCopyingShareLink(false);
        copyCooldownRef.current = null;
      }, 750);
    } catch {
      setCopyingShareLink(false);
    }
  };

  const leftImage = selectedSet.images[leftActiveIndex];

  return (
    <div className="mx-auto mt-24 mb-12 max-w-4xl space-y-8 px-4 sm:px-6">
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Field of View Reference</h1>
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
            Share this view
          </Button>
        </div>
        <div className="flex flex-col gap-2">
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

      <section className="space-y-3">
        <div className="flex flex-col gap-2">
          <SensorFormatInput
            id="left-sensor-format-mobile"
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
        {leftImage ? (
          <ScrollItem
            {...leftImage}
            isActive
            distanceFromActive={0}
            labelPosition="left"
            overlayTargetFocalLength={null}
            sensorCropFactor={leftCropFactor}
            sensorCropLabel={leftCropLabel}
            size="sm"
          />
        ) : null}
      </section>
    </div>
  );
}
