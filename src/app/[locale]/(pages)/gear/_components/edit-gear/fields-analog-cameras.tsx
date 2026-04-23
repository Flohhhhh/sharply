"use client";

import { useTranslations, type TranslationValues } from "next-intl";
import { BooleanInput,MultiTextInput,NumberInput } from "~/components/custom-inputs";
import { Card,CardContent,CardHeader,CardTitle } from "~/components/ui/card";
import { MultiSelect } from "~/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  getSpecFieldLabel,
  getSpecSectionTitle,
  translateGearDetailWithFallback,
} from "~/lib/i18n/gear-detail";
import { ANALOG_OPTIONS } from "~/lib/mapping/analog-types-map";
import type { AnalogCameraSpecs } from "~/types/gear";

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
  const t = useTranslations("gearDetail");
  const tf = (key: string, fallback: string, values?: TranslationValues) =>
    translateGearDetailWithFallback(t, key, fallback, values);
  const specLabel = (fieldKey: string, fallback: string) =>
    getSpecFieldLabel(t, "analog-camera", fieldKey, fallback);

  return (
    <Card
      id={sectionId ?? "analog-camera-section"}
      className="border-0 bg-transparent px-0 py-0 shadow-none"
    >
      <CardHeader className="px-0 pb-0">
        <CardTitle className="text-xl font-semibold">
          {tf(
            "editGear.sections.analogCameraSpecifications",
            getSpecSectionTitle(t, "analog-camera", "Analog Camera Specs"),
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="flex flex-col gap-3">
          {shouldShowField(currentSpecs?.cameraType, showMissingOnly) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {specLabel("cameraType", "Camera Type")}
              </label>
              <Select
                value={currentSpecs?.cameraType ?? undefined}
                onValueChange={(value) => onChange("cameraType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={tf(
                      "editGear.fields.analogCameraTypePlaceholder",
                      "Select camera type",
                    )}
                  />
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
              <label className="text-sm font-medium">
                {specLabel("captureMedium", "Capture Medium")}
              </label>
              <Select
                value={currentSpecs?.captureMedium ?? undefined}
                onValueChange={(value) => onChange("captureMedium", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={tf(
                      "editGear.fields.captureMediumPlaceholder",
                      "Select capture medium",
                    )}
                  />
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
              <label className="text-sm font-medium">
                {specLabel("filmTransportType", "Film Transport")}
              </label>
              <Select
                value={currentSpecs?.filmTransportType ?? undefined}
                onValueChange={(value) => onChange("filmTransportType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={tf(
                      "editGear.fields.filmTransportPlaceholder",
                      "Select film transport",
                    )}
                  />
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
              <label className="text-sm font-medium">
                {specLabel("viewfinderType", "Viewfinder Type")}
              </label>
              <Select
                value={currentSpecs?.viewfinderType ?? undefined}
                onValueChange={(value) => onChange("viewfinderType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={tf(
                      "editGear.fields.analogViewfinderPlaceholder",
                      "Select viewfinder",
                    )}
                  />
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
              <label className="text-sm font-medium">
                {specLabel("shutterType", "Shutter Type")}
              </label>
              <Select
                value={currentSpecs?.shutterType ?? undefined}
                onValueChange={(value) => onChange("shutterType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={tf(
                      "editGear.fields.analogShutterTypePlaceholder",
                      "Select shutter type",
                    )}
                  />
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
              label={tf("editGear.fields.shutterSpeedMaxSeconds", "Shutter Speed Max (s)")}
              value={currentSpecs?.shutterSpeedMax ?? null}
              onChange={(value) => onChange("shutterSpeedMax", value)}
              min={0}
              step={1}
            />
          )}

          {shouldShowField(currentSpecs?.shutterSpeedMin, showMissingOnly) && (
            <NumberInput
              id="shutterSpeedMin"
              label={tf(
                "editGear.fields.shutterSpeedMinFraction",
                "Shutter Speed Min (1/x s)",
              )}
              value={currentSpecs?.shutterSpeedMin ?? null}
              onChange={(value) => onChange("shutterSpeedMin", value)}
              min={0}
              step={1}
            />
          )}

          {shouldShowField(currentSpecs?.flashSyncSpeed, showMissingOnly) && (
            <NumberInput
              id="flashSyncSpeed"
              label={specLabel("flashSyncSpeed", "Flash Sync Speed (1/x s)")}
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
              label={specLabel("hasBulbMode", "Bulb Mode")}
              checked={currentSpecs?.hasBulbMode ?? null}
              onChange={(value) => onChange("hasBulbMode", value)}
              allowNull
              showStateText
            />
          )}

          {shouldShowField(currentSpecs?.hasMetering, showMissingOnly) && (
            <BooleanInput
              id="hasMetering"
              label={specLabel("hasMetering", "Has Metering")}
              checked={currentSpecs?.hasMetering ?? null}
              onChange={(value) => onChange("hasMetering", value)}
              allowNull
              showStateText
            />
          )}

          {shouldShowField(currentSpecs?.meteringModes, showMissingOnly) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {specLabel("meteringModes", "Metering Modes")}
              </label>
              <MultiSelect
                options={toMulti(meteringModeOptions)}
                value={currentSpecs?.meteringModes ?? []}
                onChange={(value) => onChange("meteringModes", value)}
                placeholder={tf(
                  "editGear.fields.meteringModesPlaceholder",
                  "Select metering modes",
                )}
                className="w-full"
              />
            </div>
          )}

          {shouldShowField(
            currentSpecs?.meteringDisplayTypes,
            showMissingOnly,
          ) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {specLabel("meteringDisplayTypes", "Metering Display")}
              </label>
              <MultiSelect
                options={toMulti(meteringDisplayOptions)}
                value={currentSpecs?.meteringDisplayTypes ?? []}
                onChange={(value) => onChange("meteringDisplayTypes", value)}
                placeholder={tf(
                  "editGear.fields.meteringDisplayPlaceholder",
                  "Select display types",
                )}
                className="w-full"
              />
            </div>
          )}

          {shouldShowField(currentSpecs?.exposureModes, showMissingOnly) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {specLabel("exposureModes", "Exposure Modes")}
              </label>
              <MultiSelect
                options={toMulti(exposureModeOptions)}
                value={currentSpecs?.exposureModes ?? []}
                onChange={(value) => onChange("exposureModes", value)}
                placeholder={tf(
                  "editGear.fields.exposureModesPlaceholder",
                  "Select exposure modes",
                )}
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
              label={specLabel("hasExposureCompensation", "Exposure Compensation")}
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
              <label className="text-sm font-medium">
                {specLabel("isoSettingMethod", "ISO Setting")}
              </label>
              <Select
                value={currentSpecs?.isoSettingMethod ?? undefined}
                onValueChange={(value) => onChange("isoSettingMethod", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={tf(
                      "editGear.fields.isoSettingPlaceholder",
                      "Select ISO setting",
                    )}
                  />
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
              label={tf("editGear.fields.isoMin", "ISO Min")}
              value={currentSpecs?.isoMin ?? null}
              onChange={(value) => onChange("isoMin", value)}
              min={0}
              step={1}
            />
          )}

          {shouldShowField(currentSpecs?.isoMax, showMissingOnly) && (
            <NumberInput
              id="isoMax"
              label={tf("editGear.fields.isoMax", "ISO Max")}
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
              label={specLabel("hasAutoFocus", "Has Autofocus")}
              checked={currentSpecs?.hasAutoFocus ?? null}
              onChange={(value) => onChange("hasAutoFocus", value)}
              allowNull
              showStateText
              className="w-full"
            />
          )}

          {shouldShowField(currentSpecs?.focusAidTypes, showMissingOnly) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {specLabel("focusAidTypes", "Focus Aids")}
              </label>
              <MultiSelect
                options={toMulti(focusAidOptions)}
                value={currentSpecs?.focusAidTypes ?? []}
                onChange={(value) => onChange("focusAidTypes", value)}
                placeholder={tf(
                  "editGear.fields.focusAidsPlaceholder",
                  "Select focus aids",
                )}
              />
            </div>
          )}

          {shouldShowField(
            currentSpecs?.hasContinuousDrive,
            showMissingOnly,
          ) && (
            <BooleanInput
              id="hasContinuousDrive"
              label={specLabel("hasContinuousDrive", "Continuous Drive")}
              checked={currentSpecs?.hasContinuousDrive ?? null}
              onChange={(value) => onChange("hasContinuousDrive", value)}
              allowNull
              showStateText
            />
          )}

          {shouldShowField(currentSpecs?.maxContinuousFps, showMissingOnly) && (
            <NumberInput
              id="maxContinuousFps"
              label={tf("editGear.fields.maxContinuousFps", "Max Continuous FPS")}
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
              label={tf(
                "editGear.fields.requiresBatteryForShutter",
                "Requires Battery for Shutter",
              )}
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
              label={tf(
                "editGear.fields.requiresBatteryForMetering",
                "Requires Battery for Metering",
              )}
              checked={currentSpecs?.requiresBatteryForMetering ?? null}
              onChange={(value) =>
                onChange("requiresBatteryForMetering", value)
              }
              allowNull
              showStateText
              className="w-full"
            />
          )}

          {shouldShowField(currentSpecs?.supportedBatteries, showMissingOnly) && (
            <div
              data-force-ring-container
              className="space-y-2"
            >
              <MultiTextInput
                id="supportedBatteries"
                label={specLabel("supportedBatteries", "Supported Batteries")}
                values={
                  Array.isArray(currentSpecs?.supportedBatteries)
                    ? currentSpecs.supportedBatteries.filter(
                        (x): x is string => typeof x === "string"
                      )
                    : []
                }
                onChange={(value) => onChange("supportedBatteries", value)}
                placeholder={tf(
                  "editGear.fields.analogBatteryPlaceholder",
                  "e.g., CR2032, LR44",
                )}
              />
            </div>
          )}

          {shouldShowField(currentSpecs?.hasHotShoe, showMissingOnly) && (
            <BooleanInput
              id="hasHotShoe"
              label={specLabel("hasHotShoe", "Hot Shoe")}
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
              label={specLabel("hasSelfTimer", "Self Timer")}
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
              label={specLabel("hasIntervalometer", "Intervalometer")}
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
              label={tf("editGear.fields.autoFilmAdvance", "Auto Film Advance")}
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
              label={tf(
                "editGear.fields.optionalMotorizedDrive",
                "Optional Motorized Drive",
              )}
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
