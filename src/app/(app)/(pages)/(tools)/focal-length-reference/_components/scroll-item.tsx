import { cn } from "~/lib/utils";
import type { ImageSet } from "../data";
import Image from "next/image";

const SHOW_FOCAL_LENGTH_OVERLAY = false;

type ScrollItemProps = ImageSet["images"][number] & {
  size?: "default" | "sm";
  isActive?: boolean;
  distanceFromActive?: number;
  onSelect?: () => void;
  labelPosition?: "left" | "right";
  overlayTargetFocalLength?: number | null;
  sensorCropFactor?: number | null;
  sensorCropLabel?: string | null;
};

export function ScrollItem(props: ScrollItemProps) {
  const {
    size = "default",
    isActive = false,
    distanceFromActive = 0,
    onSelect,
    labelPosition = "left",
    overlayTargetFocalLength = null,
    sensorCropFactor = null,
    sensorCropLabel = null,
    ...image
  } = props;

  const scaleClass =
    distanceFromActive === 0
      ? "scale-100"
      : distanceFromActive === 1
        ? "scale-90"
        : "scale-75 ";
  const opacityClass =
    distanceFromActive === 0
      ? "opacity-100"
      : distanceFromActive === 1
        ? "opacity-50"
        : "opacity-25";

  const shouldShowOverlay =
    SHOW_FOCAL_LENGTH_OVERLAY &&
    isActive &&
    overlayTargetFocalLength !== null &&
    overlayTargetFocalLength > image.focalLengthMm;

  const overlayScale = shouldShowOverlay
    ? Math.min(image.focalLengthMm / overlayTargetFocalLength, 1)
    : 1;

  const shouldShowSensorCrop =
    sensorCropFactor !== null &&
    Number.isFinite(sensorCropFactor) &&
    sensorCropFactor > 1;
  const sensorCropScale = shouldShowSensorCrop ? 1 / sensorCropFactor : 1;
  const effectiveFocalLength = shouldShowSensorCrop
    ? Math.round(image.focalLengthMm * sensorCropFactor)
    : null;
  const sensorCropLabelText = sensorCropLabel
    ? size === "sm"
      ? sensorCropLabel
      : effectiveFocalLength
        ? `${sensorCropLabel} - Effective focal length: ${effectiveFocalLength}mm`
        : sensorCropLabel
    : undefined;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group block w-full focus:outline-none"
    >
      <div
        className={[
          "relative aspect-3/2 overflow-hidden rounded-xl border-4 transition duration-200",
          isActive
            ? "ring-primary shadow-primary/30 shadow-lg ring-2"
            : "hover:shadow-md hover:shadow-black/10",
          scaleClass,
          opacityClass,
        ].join(" ")}
      >
        <Image
          src={image.url}
          alt={image.focalLengthMm.toString()}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        {shouldShowSensorCrop && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="relative rounded-lg border border-white/50"
              style={{
                width: `${sensorCropScale * 100}%`,
                height: `${sensorCropScale * 100}%`,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                transition: "width 200ms ease-out, height 200ms ease-out",
              }}
            >
              {sensorCropLabelText ? (
                <div
                  className={cn(
                    "absolute -top-2 left-0 -translate-y-full rounded-md bg-black/50 px-3 py-1.5 leading-none font-semibold text-white",
                    size === "sm" ? "text-xs" : "text-sm",
                  )}
                >
                  {sensorCropLabelText}
                </div>
              ) : null}
            </div>
          </div>
        )}
        {shouldShowOverlay && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "h-full w-full rounded-xl border-red-500/80 bg-red-500/10 transition-transform duration-200 ease-out",
                overlayScale >= 0.99
                  ? "border-2"
                  : overlayScale >= 0.5
                    ? "border-8"
                    : overlayScale >= 0.1
                      ? "border-12"
                      : "border-32",
              )}
              style={{
                transform: `scale(${overlayScale})`,
                transformOrigin: "center",
              }}
            />
            <div className="absolute top-0 right-0 translate-x-full -translate-y-full rounded-md bg-black/70 px-2.5 py-1 text-[11px] leading-none font-semibold text-white shadow-sm">
              {overlayTargetFocalLength}mm
            </div>
          </div>
        )}

        <div
          className={cn(
            "absolute top-3 hidden rounded-md bg-black/60 px-3 py-1 font-semibold text-white md:block",
            labelPosition === "right" ? "right-3" : "left-3",
          )}
        >
          {image.focalLengthMm}mm
        </div>
      </div>
    </button>
  );
}
