"use client";

import { useCallback, memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { cameraSpecs, sensorFormats } from "~/server/db/schema";
import { SENSOR_FORMATS, ENUMS, AF_AREA_MODES } from "~/lib/constants";
import IsoInput from "~/components/custom-inputs/iso-input";
import SensorFormatInput from "~/components/custom-inputs/sensor-format-input";
import { NumberInput, MultiTextInput } from "~/components/custom-inputs";
import { Switch } from "~/components/ui/switch";
import { BooleanInput } from "~/components/custom-inputs";
import { InfoIcon } from "lucide-react";
import { Input } from "~/components/ui/input";
import { MultiSelect } from "~/components/ui/multi-select";
import type { EnrichedCameraSpecs, GearItem } from "~/types/gear";

interface CameraFieldsProps {
  gearItem: GearItem;
  currentSpecs: EnrichedCameraSpecs | null | undefined;
  onChange: (field: string, value: any) => void;
}

// Using shared NumberInput from custom-inputs

function CameraFieldsComponent({
  gearItem,
  currentSpecs,
  onChange,
}: CameraFieldsProps) {
  // Debug logging
  // console.log("CameraFieldsComponent - currentSpecs:", currentSpecs);

  //if afarea modes is completely missing throw an error
  // if things are working we should get an empty array for no items
  if (!currentSpecs?.afAreaModes) {
    throw new Error("afAreaModes is completely missing");
  }

  // // Use sensor formats from constants
  // const sensorFormatOptions = useMemo(
  //   () =>
  //     SENSOR_FORMATS.map((format) => ({
  //       id: format.slug,
  //       name: format.name,
  //     })),
  //   [],
  // );

  const afAreaModeOptions = useMemo(() => {
    const list: unknown = AF_AREA_MODES;
    if (!Array.isArray(list)) return [] as { id: string; name: string }[];
    const typed = list.filter(
      (mode): mode is { id: string; name: string; brand_id: string | number } =>
        typeof mode === "object" &&
        mode !== null &&
        "id" in mode &&
        "name" in mode &&
        "brand_id" in mode,
    );
    return typed
      .filter((mode) => mode.brand_id === gearItem.brandId)
      .map((mode) => ({ id: mode.id, name: mode.name }));
  }, [gearItem.brandId]);

  const selectedAfAreaModeIds: string[] = useMemo(() => {
    const v: unknown = currentSpecs?.afAreaModes;
    if (!Array.isArray(v) || v.length === 0) return [];
    if (v.every((e): e is string => typeof e === "string")) return v;
    const ids = v
      .map((m): string | undefined => {
        if (typeof m === "object" && m !== null && "id" in m) {
          const id = (m as { id: unknown }).id;
          return typeof id === "string" ? id : undefined;
        }
        return undefined;
      })
      .filter((x): x is string => typeof x === "string");
    return ids;
  }, [currentSpecs?.afAreaModes]);

  const handleFieldChange = useCallback(
    (fieldId: string, value: any) => {
      console.log("handleFieldChange called:", { fieldId, value });
      onChange(fieldId, value);
    },
    [onChange],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Camera Specifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Sensor Format */}
          <SensorFormatInput
            id="sensorFormatId"
            label="Sensor Format"
            value={currentSpecs?.sensorFormatId}
            onChange={(value) => handleFieldChange("sensorFormatId", value)}
          />

          {/* Resolution - Standard Number Input */}
          <NumberInput
            id="resolutionMp"
            label="Resolution (megapixels)"
            value={
              currentSpecs?.resolutionMp
                ? parseFloat(currentSpecs.resolutionMp)
                : null
            }
            onChange={(value) => handleFieldChange("resolutionMp", value)}
            placeholder="e.g., 45.0"
            step={0.1}
            min={0}
          />

          {/* Sensor Stacking Type */}
          <div className="space-y-2">
            <Label htmlFor="sensorStackingType">Sensor Stacking Type</Label>
            <Select
              value={currentSpecs?.sensorStackingType ?? ""}
              onValueChange={(value) =>
                handleFieldChange("sensorStackingType", value)
              }
            >
              <SelectTrigger id="sensorStackingType" className="w-full">
                <SelectValue placeholder="Sensor Stacking Type" />
              </SelectTrigger>
              <SelectContent>
                {ENUMS.sensor_stacking_types_enum.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type
                      .replace("-", " ")
                      .split(" ")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1),
                      )
                      .join(" ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sensor Tech Type */}
          <div className="space-y-2">
            <Label htmlFor="sensorTechType">Sensor Tech Type</Label>
            <Select
              value={currentSpecs?.sensorTechType ?? ""}
              onValueChange={(value) =>
                handleFieldChange("sensorTechType", value)
              }
            >
              <SelectTrigger id="sensorTechType" className="w-full">
                <SelectValue placeholder="Sensor Tech Type" />
              </SelectTrigger>
              <SelectContent>
                {ENUMS.sensor_tech_types_enum.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Is Back Side Illuminated */}

          <BooleanInput
            id="isBackSideIlluminated"
            label="Back Side Illuminated"
            checked={currentSpecs?.isBackSideIlluminated ?? null}
            allowNull
            showStateText
            onChange={(value) =>
              handleFieldChange("isBackSideIlluminated", value)
            }
          />

          {/* Sensor Readout Speed */}

          <NumberInput
            id="sensorReadoutSpeedMs"
            label="Sensor Readout Speed (ms)"
            value={currentSpecs?.sensorReadoutSpeedMs ?? null}
            onChange={(value) =>
              handleFieldChange("sensorReadoutSpeedMs", value)
            }
            suffix="ms"
            placeholder="e.g., 10ms"
            min={1}
            step={1}
          />

          {/* ISO Min */}
          <IsoInput
            id="isoMin"
            label="ISO Min"
            value={currentSpecs?.isoMin}
            onChange={(value) => handleFieldChange("isoMin", value)}
          />

          {/* ISO Max */}
          <IsoInput
            id="isoMax"
            label="ISO Max"
            value={currentSpecs?.isoMax}
            onChange={(value) => handleFieldChange("isoMax", value)}
          />

          {/* Max Raw Bit Depth */}
          <div className="space-y-2">
            <Label htmlFor="maxRawBitDepth">Max Raw Bit Depth</Label>
            <Select
              value={currentSpecs?.maxRawBitDepth ?? ""}
              onValueChange={(value) =>
                handleFieldChange("maxRawBitDepth", value)
              }
            >
              <SelectTrigger id="maxRawBitDepth" className="w-full">
                <SelectValue placeholder="Max Raw Bit Depth" />
              </SelectTrigger>
              <SelectContent>
                {ENUMS.raw_bit_depth_enum.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type} bit
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Has Ibis */}
          <BooleanInput
            id="hasIbis"
            label="Has IBIS (Physical)"
            checked={currentSpecs?.hasIbis ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasIbis", value)}
          />

          {/* Has Electronic Vibration Reduction */}
          <BooleanInput
            id="hasElectronicVibrationReduction"
            label="Has Electronic VR (Digital)"
            checked={currentSpecs?.hasElectronicVibrationReduction ?? null}
            allowNull
            showStateText
            onChange={(value) =>
              handleFieldChange("hasElectronicVibrationReduction", value)
            }
          />

          {/* CIPA Stabilization Rating Stops */}
          <NumberInput
            id="cipaStabilizationRatingStops"
            label="CIPA Stabilization Rating Stops"
            value={Number(currentSpecs?.cipaStabilizationRatingStops ?? null)}
            onChange={(value) =>
              handleFieldChange("cipaStabilizationRatingStops", value)
            }
            placeholder="e.g., 3.0"
            min={0}
            max={10}
            step={0.1}
            suffix="stops"
          />

          {/* Has Pixel Shift Shooting */}
          <BooleanInput
            id="hasPixelShiftShooting"
            label="Has Pixel Shift Shooting"
            checked={currentSpecs?.hasPixelShiftShooting ?? null}
            allowNull
            showStateText
            onChange={(value) =>
              handleFieldChange("hasPixelShiftShooting", value)
            }
          />

          {/* Has Anti Aliasing Filter */}
          <BooleanInput
            id="hasAntiAliasingFilter"
            label="Has Anti Aliasing Filter"
            checked={currentSpecs?.hasAntiAliasingFilter ?? null}
            allowNull
            showStateText
            onChange={(value) =>
              handleFieldChange("hasAntiAliasingFilter", value)
            }
          />

          {/* Width */}
          <NumberInput
            id="widthMm"
            label="Width (mm)"
            value={Number(currentSpecs?.widthMm ?? null)}
            onChange={(value) => handleFieldChange("widthMm", value)}
            placeholder="e.g., 100"
            suffix="mm"
          />

          {/* Height */}
          <NumberInput
            id="heightMm"
            label="Height (mm)"
            value={Number(currentSpecs?.heightMm ?? null)}
            onChange={(value) => handleFieldChange("heightMm", value)}
            placeholder="e.g., 100"
            suffix="mm"
          />

          {/* Depth */}
          <NumberInput
            id="depthMm"
            label="Depth (mm)"
            value={Number(currentSpecs?.depthMm ?? null)}
            onChange={(value) => handleFieldChange("depthMm", value)}
            placeholder="e.g., 100"
            suffix="mm"
          />

          {/* Processor Name */}
          <div className="space-y-2">
            <Label htmlFor="processorName">Processor Name</Label>
            <Input
              id="processorName"
              value={currentSpecs?.processorName ?? ""}
              onChange={(value) => handleFieldChange("processorName", value)}
            />
          </div>

          {/* Has Weather Sealing */}
          <BooleanInput
            id="hasWeatherSealing"
            label="Has Weather Sealing"
            checked={currentSpecs?.hasWeatherSealing ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasWeatherSealing", value)}
          />

          {/* Focus Points */}
          <NumberInput
            id="focusPoints"
            label="Focus Points"
            value={Number(currentSpecs?.focusPoints ?? null)}
            onChange={(value) => handleFieldChange("focusPoints", value)}
          />

          {/* AF Area Modes */}
          {/* TODO: add a way for creating new af area modes (review plan)*/}
          <div className="space-y-2">
            <Label htmlFor="afAreaModes">AF Area Modes</Label>
            <MultiSelect
              options={afAreaModeOptions}
              value={selectedAfAreaModeIds}
              onChange={(value) => handleFieldChange("afAreaModes", value)}
            />
          </div>

          {/* Has Focus Peaking */}
          <BooleanInput
            id="hasFocusPeaking"
            label="Has Focus Peaking"
            checked={currentSpecs?.hasFocusPeaking ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasFocusPeaking", value)}
          />

          {/* Has Focus Bracketing */}
          <BooleanInput
            id="hasFocusBracketing"
            label="Has Focus Bracketing"
            checked={currentSpecs?.hasFocusBracketing ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasFocusBracketing", value)}
          />

          {/* Shutter Speed Max */}
          <NumberInput
            id="shutterSpeedMax"
            label="Longest Shutter Speed"
            suffix="seconds"
            value={Number(currentSpecs?.shutterSpeedMax ?? null)}
            onChange={(value) => handleFieldChange("shutterSpeedMax", value)}
          />

          {/* Shutter Speed Min */}
          <NumberInput
            id="shutterSpeedMin"
            label="Shortest Shutter Speed"
            prefix="1/"
            value={Number(currentSpecs?.shutterSpeedMin ?? null)}
            onChange={(value) => handleFieldChange("shutterSpeedMin", value)}
          />

          {/* Max FPS RAW */}
          <NumberInput
            id="maxFpsRaw"
            label="Max FPS (RAW)"
            value={currentSpecs?.maxFpsRaw}
            onChange={(value) => handleFieldChange("maxFpsRaw", value)}
            placeholder="e.g., 20"
            min={1}
            max={120}
            step={1}
            suffix="fps"
          />

          {/* Max FPS JPEG */}
          <NumberInput
            id="maxFpsJpg"
            label="Max FPS (JPEG)"
            value={currentSpecs?.maxFpsJpg}
            onChange={(value) => handleFieldChange("maxFpsJpg", value)}
            placeholder="e.g., 20"
            min={1}
            max={120}
            step={1}
            suffix="fps"
          />

          {/* Flash Sync Speed */}
          <NumberInput
            id="flashSyncSpeed"
            label="Flash Sync Speed"
            prefix="1/"
            value={currentSpecs?.flashSyncSpeed}
            onChange={(value) => handleFieldChange("flashSyncSpeed", value)}
          />

          {/* Has Silent Shooting Available */}
          <BooleanInput
            id="hasSilentShootingAvailable"
            label="Has Silent Shooting Available"
            checked={currentSpecs?.hasSilentShootingAvailable ?? null}
            allowNull
            showStateText
            onChange={(value) =>
              handleFieldChange("hasSilentShootingAvailable", value)
            }
          />

          {/* Available Shutter Types */}
          <div className="space-y-2">
            <Label htmlFor="availableShutterTypes">
              Available Shutter Types
            </Label>
            <MultiSelect
              inDialog
              options={ENUMS.shutter_types_enum.map((type) => ({
                id: type,
                // TODO map these proper formatted names
                name: type,
              }))}
              value={currentSpecs?.availableShutterTypes ?? []}
              onChange={(value: string[]) =>
                handleFieldChange("availableShutterTypes", value)
              }
            />
          </div>

          {/* CIPA Battery Shots Per Charge */}
          <NumberInput
            id="cipaBatteryShotsPerCharge"
            label="CIPA Battery Shots Per Charge"
            value={currentSpecs?.cipaBatteryShotsPerCharge}
            onChange={(value) =>
              handleFieldChange("cipaBatteryShotsPerCharge", value)
            }
          />

          {/* Supported Batteries */}
          <MultiTextInput
            id="supportedBatteries"
            label="Supported Batteries"
            values={
              Array.isArray((currentSpecs as any)?.supportedBatteries)
                ? (
                    (currentSpecs as any).supportedBatteries as unknown[]
                  ).filter((x): x is string => typeof x === "string")
                : []
            }
            onChange={(value) => handleFieldChange("supportedBatteries", value)}
            placeholder="e.g., NP-FZ100"
          />

          {/* USB Charging */}
          <BooleanInput
            id="usbCharging"
            label="USB Charging"
            checked={currentSpecs?.usbCharging ?? null}
            allowNull
            showStateText
            tooltip="Camera is able to charge its inserted batteries via USB"
            onChange={(value) => handleFieldChange("usbCharging", value)}
          />

          {/* USB Power Delivery */}
          <BooleanInput
            id="usbPowerDelivery"
            label="USB Power Delivery"
            checked={currentSpecs?.usbPowerDelivery ?? null}
            allowNull
            showStateText
            tooltip="Camera is able to operate while plugged into USB and will draw less or no power from the battery"
            onChange={(value) => handleFieldChange("usbPowerDelivery", value)}
          />

          {/* Has Log Color Profile */}
          <BooleanInput
            id="hasLogColorProfile"
            label="Has Log Color Profile"
            checked={currentSpecs?.hasLogColorProfile ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasLogColorProfile", value)}
          />

          {/* Has 10 Bit Video */}
          <BooleanInput
            id="has10BitVideo"
            label="Has 10 Bit Video"
            checked={currentSpecs?.has10BitVideo ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("has10BitVideo", value)}
          />

          {/* Has 12 Bit Video */}
          <BooleanInput
            id="has12BitVideo"
            label="Has 12 Bit Video"
            checked={currentSpecs?.has12BitVideo ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("has12BitVideo", value)}
          />

          {/* Has Intervalometer */}
          <BooleanInput
            id="hasIntervalometer"
            label="Has Intervalometer"
            checked={currentSpecs?.hasIntervalometer ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasIntervalometer", value)}
          />

          {/* Has Self Timer */}
          <BooleanInput
            id="hasSelfTimer"
            label="Has Self Timer"
            checked={currentSpecs?.hasSelfTimer ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasSelfTimer", value)}
          />

          {/* Has Built In Flash */}
          <BooleanInput
            id="hasBuiltInFlash"
            label="Has Built In Flash"
            checked={currentSpecs?.hasBuiltInFlash ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasBuiltInFlash", value)}
          />

          {/* Has Hot Shoe */}
          <BooleanInput
            id="hasHotShoe"
            label="Has Hot Shoe"
            checked={currentSpecs?.hasHotShoe ?? null}
            allowNull
            showStateText
            onChange={(value) => handleFieldChange("hasHotShoe", value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(CameraFieldsComponent);
