"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ExampleUsage } from "~/components/ui/example-usage";
import ApertureInput from "~/components/custom-inputs/aperture-input";
import IsoInput from "~/components/custom-inputs/iso-input";
import SensorFormatInput from "~/components/custom-inputs/sensor-format-input";
import CurrencyInput from "~/components/custom-inputs/currency-input";
import { DateInput } from "~/components/custom-inputs/date-input";
import { NumberInput } from "~/components/custom-inputs/number-input";

export default function UIDemoPage() {
  const [apertureValue, setApertureValue] = useState<number | undefined>(
    undefined,
  );
  const [isoMinValue, setIsoMinValue] = useState<number | undefined>(undefined);
  const [isoMaxValue, setIsoMaxValue] = useState<number | undefined>(undefined);
  const [sensorFormatValue, setSensorFormatValue] = useState<
    string | undefined
  >(undefined);
  const [currencyValue, setCurrencyValue] = useState<number | undefined>(
    undefined,
  );
  const [dateValue, setDateValue] = useState<string | null>(null);
  const [numberValue, setNumberValue] = useState<number | null>(null);

  return (
    <div className="container mx-auto space-y-8 p-6">
      <h1 className="text-3xl font-bold">UI Demo Page</h1>

      {/* Aperture Input Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Aperture Input Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ApertureInput
            id="demo-aperture"
            label="Maximum Aperture"
            value={apertureValue}
            onChange={setApertureValue}
            placeholder="e.g., 2.8"
          />

          <div className="text-muted-foreground text-sm">
            <p>
              Current value:{" "}
              {apertureValue ? `f/${apertureValue}` : "None selected"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sensor Format Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Sensor Format Input Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SensorFormatInput
            id="demo-sensor-format"
            label="Sensor Format"
            value={sensorFormatValue}
            onChange={setSensorFormatValue}
          />

          <div className="text-muted-foreground text-sm">
            <p>Current value: {sensorFormatValue || "None selected"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Currency Input Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Currency Input Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CurrencyInput
            id="demo-currency"
            label="Price"
            value={currencyValue}
            onChange={setCurrencyValue}
            placeholder="0.00"
            min={0}
          />

          <div className="text-muted-foreground text-sm">
            <p>
              Current value:{" "}
              {currencyValue ? `$${currencyValue}` : "None entered"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ISO Input Demo */}
      <Card>
        <CardHeader>
          <CardTitle>ISO Input Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <IsoInput
              id="demo-iso-min"
              label="ISO Min"
              value={isoMinValue}
              onChange={setIsoMinValue}
            />

            <IsoInput
              id="demo-iso-max"
              label="ISO Max"
              value={isoMaxValue}
              onChange={setIsoMaxValue}
            />
          </div>

          <div className="text-muted-foreground text-sm">
            <p>
              ISO Min: {isoMinValue ? `ISO ${isoMinValue}` : "None selected"}
            </p>
            <p>
              ISO Max: {isoMaxValue ? `ISO ${isoMaxValue}` : "None selected"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Original Example Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Original UI Components</CardTitle>
        </CardHeader>
        <CardContent>
          <ExampleUsage />
        </CardContent>
      </Card>

      {/* date input component */}
      <Card>
        <CardHeader>
          <CardTitle>Date Input Component</CardTitle>
        </CardHeader>
        <CardContent>
          <DateInput label="Date" value={dateValue} onChange={setDateValue} />
        </CardContent>
      </Card>

      {/* number inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Number Input Component</CardTitle>
        </CardHeader>
        <CardContent>
          <NumberInput
            step={0.1}
            min={0}
            max={100}
            placeholder="0.0"
            prefix="£"
            suffix="%"
            id="demo-number"
            label="Number"
            value={numberValue}
            onChange={setNumberValue}
          />
        </CardContent>
      </Card>
    </div>
  );
}
