"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ExampleUsage } from "~/components/ui/example-usage";
import ApertureInput from "~/components/custom-inputs/aperture-input";
import IsoInput from "~/components/custom-inputs/iso-input";
import SensorFormatInput from "~/components/custom-inputs/sensor-format-input";

export default function UIDemoPage() {
  const [apertureValue, setApertureValue] = useState<number | undefined>(
    undefined,
  );
  const [isoMinValue, setIsoMinValue] = useState<number | undefined>(undefined);
  const [isoMaxValue, setIsoMaxValue] = useState<number | undefined>(undefined);
  const [sensorFormatValue, setSensorFormatValue] = useState<
    string | undefined
  >(undefined);

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
    </div>
  );
}
