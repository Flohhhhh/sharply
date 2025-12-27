"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { MultiSelect } from "~/components/ui/multi-select";
import { BooleanInput, NumberInput } from "~/components/custom-inputs";
import type { AnalogCameraSpecs } from "~/types/gear";
import { humanizeKey } from "~/lib/utils";
import { ANALOG_OPTIONS } from "~/lib/mapping/analog-types-map";

type Option = { value: string; label: string };
const toMulti = (opts: Option[]) =>
  opts.map((opt) => ({ id: opt.value, name: opt.label }));

const normalize = (opts: { id: string; name: string }[]) =>
  opts.map(({ id, name }) => ({ value: id, label: name }));

const analogCameraTypeOptions = normalize(ANALOG_OPTIONS.cameraTypes);
const analogMediumOptions = normalize(ANALOG_OPTIONS.media);
const filmTransportOptions = normalize(ANALOG_OPTIONS.filmTransport);
const exposureModeOptions = normalize(ANALOG_OPTIONS.exposureModes);
const meteringModeOptions = normalize(ANALOG_OPTIONS.meteringModes);
const meteringDisplayOptions = normalize(ANALOG_OPTIONS.meteringDisplays);
const focusAidOptions = normalize(ANALOG_OPTIONS.focusAids);
const shutterTypeOptions = normalize(ANALOG_OPTIONS.shutterTypes);
const isoSettingMethodOptions = normalize(ANALOG_OPTIONS.isoSettingMethods);
const analogViewfinderTypeOptions = normalize(ANALOG_OPTIONS.viewfinderTypes);

function shouldShowField(value: unknown, showMissingOnly?: boolean): boolean {
  if (!showMissingOnly) return true;
  if (Array.isArray(value)) return value.length === 0;
  return value === null || value === undefined || value === "";
}

interface AnalogCameraFieldsProps {
  currentSpecs: AnalogCameraSpecs | null | undefined;
  initialSpecs?: AnalogCameraSpecs | null | undefined;
  showMissingOnly?: boolean;
  onChange: (field: keyof AnalogCameraSpecs, value: any) => void;
  sectionId?: string;
}

export function AnalogCameraFields({
  currentSpecs,
  showMissingOnly,
  onChange,
  sectionId,
}: AnalogCameraFieldsProps) {
  return (
    <Card
      id={sectionId ?? "analog-camera-section"}
      className="border-0 bg-transparent px-0 py-0 shadow-none"
    >
      <CardHeader className="px-0 pb-0">
        <CardTitle className="text-xl font-semibold">
          Analog Camera Specs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="flex flex-col gap-3">
          {shouldShowField(currentSpecs?.cameraType, showMissingOnly) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Camera Type</label>
              <Select
                value={currentSpecs?.cameraType ?? undefined}
                onValueChange={(value) => onChange("cameraType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select camera type" />
                </SelectTrigger>
                <SelectContent>
                  {analogCameraTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {shouldShowField(currentSpecs?.captureMedium, showMissingOnly) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Capture Medium</label>
              <Select
                value={currentSpecs?.captureMedium ?? undefined}
                onValueChange={(value) => onChange("captureMedium", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select capture medium" />
                </SelectTrigger>
                <SelectContent>
                  {analogMediumOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {shouldShowField(
            currentSpecs?.filmTransportType,
            showMissingOnly,
          ) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Film Transport</label>
              <Select
                value={currentSpecs?.filmTransportType ?? undefined}
                onValueChange={(value) => onChange("filmTransportType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select film transport" />
                </SelectTrigger>
                <SelectContent>
                  {filmTransportOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {shouldShowField(currentSpecs?.viewfinderType, showMissingOnly) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Viewfinder Type</label>
              <Select
                value={currentSpecs?.viewfinderType ?? undefined}
                onValueChange={(value) => onChange("viewfinderType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select viewfinder" />
                </SelectTrigger>
                <SelectContent>
                  {analogViewfinderTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {shouldShowField(currentSpecs?.shutterType, showMissingOnly) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Shutter Type</label>
              <Select
                value={currentSpecs?.shutterType ?? undefined}
                onValueChange={(value) => onChange("shutterType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select shutter type" />
                </SelectTrigger>
                <SelectContent>
                  {shutterTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {shouldShowField(currentSpecs?.shutterSpeedMax, showMissingOnly) && (
            <NumberInput
              id="shutterSpeedMax"
              label="Shutter Speed Max (s)"
              value={currentSpecs?.shutterSpeedMax ?? null}
              onChange={(value) => onChange("shutterSpeedMax", value)}
              min={0}
              step={1}
            />
          )}

          {shouldShowField(currentSpecs?.shutterSpeedMin, showMissingOnly) && (
            <NumberInput
              id="shutterSpeedMin"
              label="Shutter Speed Min (1/x s)"
              value={currentSpecs?.shutterSpeedMin ?? null}
              onChange={(value) => onChange("shutterSpeedMin", value)}
              min={0}
              step={1}
            />
          )}

          {shouldShowField(currentSpecs?.flashSyncSpeed, showMissingOnly) && (
            <NumberInput
              id="flashSyncSpeed"
              label="Flash Sync Speed (1/x s)"
              value={currentSpecs?.flashSyncSpeed ?? null}
              onChange={(value) => onChange("flashSyncSpeed", value)}
              min={0}
              step={1}
            />
          )}
        </div>

        <div className="flex flex-col gap-3">
          {shouldShowField(currentSpecs?.hasBulbMode, showMissingOnly) && (
            <BooleanInput
              id="hasBulbMode"
              label="Bulb Mode"
              checked={currentSpecs?.hasBulbMode ?? null}
              onChange={(value) => onChange("hasBulbMode", value)}
              allowNull
              showStateText
            />
          )}

          {shouldShowField(currentSpecs?.hasMetering, showMissingOnly) && (
            <BooleanInput
              id="hasMetering"
              label="Has Metering"
              checked={currentSpecs?.hasMetering ?? null}
              onChange={(value) => onChange("hasMetering", value)}
              allowNull
              showStateText
            />
          )}

          {shouldShowField(currentSpecs?.meteringModes, showMissingOnly) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Metering Modes</label>
              <MultiSelect
                options={toMulti(meteringModeOptions)}
                value={currentSpecs?.meteringModes ?? []}
                onChange={(value) => onChange("meteringModes", value)}
                placeholder="Select metering modes"
                className="w-full"
              />
            </div>
          )}

          {shouldShowField(
            currentSpecs?.meteringDisplayTypes,
            showMissingOnly,
          ) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Metering Display</label>
              <MultiSelect
                options={toMulti(meteringDisplayOptions)}
                value={currentSpecs?.meteringDisplayTypes ?? []}
                onChange={(value) => onChange("meteringDisplayTypes", value)}
                placeholder="Select display types"
                className="w-full"
              />
            </div>
          )}

          {shouldShowField(currentSpecs?.exposureModes, showMissingOnly) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Exposure Modes</label>
              <MultiSelect
                options={toMulti(exposureModeOptions)}
                value={currentSpecs?.exposureModes ?? []}
                onChange={(value) => onChange("exposureModes", value)}
                placeholder="Select exposure modes"
                className="w-full"
              />
            </div>
          )}

          {shouldShowField(
            currentSpecs?.hasExposureCompensation,
            showMissingOnly,
          ) && (
            <BooleanInput
              id="hasExposureCompensation"
              label="Exposure Compensation"
              checked={currentSpecs?.hasExposureCompensation ?? null}
              onChange={(value) => onChange("hasExposureCompensation", value)}
              allowNull
              showStateText
            />
          )}
        </div>

        <div className="flex flex-col gap-3">
          {shouldShowField(currentSpecs?.isoSettingMethod, showMissingOnly) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">ISO Setting</label>
              <Select
                value={currentSpecs?.isoSettingMethod ?? undefined}
                onValueChange={(value) => onChange("isoSettingMethod", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select ISO setting" />
                </SelectTrigger>
                <SelectContent>
                  {isoSettingMethodOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {shouldShowField(currentSpecs?.isoMin, showMissingOnly) && (
            <NumberInput
              id="isoMin"
              label="ISO Min"
              value={currentSpecs?.isoMin ?? null}
              onChange={(value) => onChange("isoMin", value)}
              min={0}
              step={1}
            />
          )}

          {shouldShowField(currentSpecs?.isoMax, showMissingOnly) && (
            <NumberInput
              id="isoMax"
              label="ISO Max"
              value={currentSpecs?.isoMax ?? null}
              onChange={(value) => onChange("isoMax", value)}
              min={0}
              step={1}
            />
          )}
        </div>

        <div className="flex flex-col gap-3">
          {shouldShowField(currentSpecs?.hasAutoFocus, showMissingOnly) && (
            <BooleanInput
              id="hasAutoFocus"
              label="Has Autofocus"
              checked={currentSpecs?.hasAutoFocus ?? null}
              onChange={(value) => onChange("hasAutoFocus", value)}
              allowNull
              showStateText
              className="w-full"
            />
          )}

          {shouldShowField(currentSpecs?.focusAidTypes, showMissingOnly) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Focus Aids</label>
              <MultiSelect
                options={toMulti(focusAidOptions)}
                value={currentSpecs?.focusAidTypes ?? []}
                onChange={(value) => onChange("focusAidTypes", value)}
                placeholder="Select focus aids"
              />
            </div>
          )}

          {shouldShowField(
            currentSpecs?.hasContinuousDrive,
            showMissingOnly,
          ) && (
            <BooleanInput
              id="hasContinuousDrive"
              label="Continuous Drive"
              checked={currentSpecs?.hasContinuousDrive ?? null}
              onChange={(value) => onChange("hasContinuousDrive", value)}
              allowNull
              showStateText
            />
          )}

          {shouldShowField(currentSpecs?.maxContinuousFps, showMissingOnly) && (
            <NumberInput
              id="maxContinuousFps"
              label="Max Continuous FPS"
              value={currentSpecs?.maxContinuousFps ?? null}
              onChange={(value) => onChange("maxContinuousFps", value)}
              min={0}
              step={1}
            />
          )}
        </div>

        <div className="flex flex-col gap-3">
          {shouldShowField(
            currentSpecs?.requiresBatteryForShutter,
            showMissingOnly,
          ) && (
            <BooleanInput
              id="requiresBatteryForShutter"
              label="Requires Battery for Shutter"
              checked={currentSpecs?.requiresBatteryForShutter ?? null}
              onChange={(value) => onChange("requiresBatteryForShutter", value)}
              allowNull
              showStateText
              className="w-full"
            />
          )}

          {shouldShowField(
            currentSpecs?.requiresBatteryForMetering,
            showMissingOnly,
          ) && (
            <BooleanInput
              id="requiresBatteryForMetering"
              label="Requires Battery for Metering"
              checked={currentSpecs?.requiresBatteryForMetering ?? null}
              onChange={(value) =>
                onChange("requiresBatteryForMetering", value)
              }
              allowNull
              showStateText
              className="w-full"
            />
          )}

          {shouldShowField(currentSpecs?.hasHotShoe, showMissingOnly) && (
            <BooleanInput
              id="hasHotShoe"
              label="Hot Shoe"
              checked={currentSpecs?.hasHotShoe ?? null}
              onChange={(value) => onChange("hasHotShoe", value)}
              allowNull
              showStateText
              className="w-full"
            />
          )}

          {shouldShowField(currentSpecs?.hasSelfTimer, showMissingOnly) && (
            <BooleanInput
              id="hasSelfTimer"
              label="Self Timer"
              checked={currentSpecs?.hasSelfTimer ?? null}
              onChange={(value) => onChange("hasSelfTimer", value)}
              allowNull
              showStateText
              className="w-full"
            />
          )}

          {shouldShowField(
            currentSpecs?.hasIntervalometer,
            showMissingOnly,
          ) && (
            <BooleanInput
              id="hasIntervalometer"
              label="Intervalometer"
              checked={currentSpecs?.hasIntervalometer ?? null}
              onChange={(value) => onChange("hasIntervalometer", value)}
              allowNull
              showStateText
              className="w-full"
            />
          )}

          {shouldShowField(
            currentSpecs?.hasAutoFilmAdvance,
            showMissingOnly,
          ) && (
            <BooleanInput
              id="hasAutoFilmAdvance"
              label="Auto Film Advance"
              checked={currentSpecs?.hasAutoFilmAdvance ?? null}
              onChange={(value) => onChange("hasAutoFilmAdvance", value)}
              allowNull
              showStateText
              className="w-full"
            />
          )}

          {shouldShowField(
            currentSpecs?.hasOptionalMotorizedDrive,
            showMissingOnly,
          ) && (
            <BooleanInput
              id="hasOptionalMotorizedDrive"
              label="Optional Motorized Drive"
              checked={currentSpecs?.hasOptionalMotorizedDrive ?? null}
              onChange={(value) => onChange("hasOptionalMotorizedDrive", value)}
              allowNull
              showStateText
              className="w-full"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
