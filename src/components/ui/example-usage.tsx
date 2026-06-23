"use client";

import { useState } from "react";
import { Avatar,AvatarFallback,AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { ColorPickerField, type RgbaColor } from "./color-picker";
import { Input } from "./input";

const colorPickerLabels = {
  trigger: "Select color",
  hex: "Hex",
  alpha: "Alpha",
  saturationLightness: "Saturation and lightness",
  hue: "Hue",
  opacity: "Opacity",
} as const;

export function ExampleUsage() {
  const [accentColor, setAccentColor] = useState<RgbaColor>({
    r: 255,
    g: 122,
    b: 0,
    a: 1,
  });
  const [overlayColor, setOverlayColor] = useState<RgbaColor>({
    r: 59,
    g: 130,
    b: 246,
    a: 0.55,
  });

  return (
    <div className="space-y-6 p-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">shadcn/ui Components Demo</h1>
        <p className="text-muted-foreground">
          This is a demonstration of the installed shadcn/ui components.
        </p>
      </div>

      {/* Buttons */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Default Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is the main content of the card.</p>
            </CardContent>
            <CardFooter>
              <Button>Action</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Another Card</CardTitle>
              <CardDescription>With different content</CardDescription>
            </CardHeader>
            <CardContent>
              <p>You can put any content here.</p>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Inputs</h2>
        <div className="space-y-2">
          <Input placeholder="Enter your name" />
          <Input placeholder="Enter your email" type="email" />
          <Input placeholder="Enter your password" type="password" />
        </div>
      </div>

      {/* Color Picker */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Color Picker</h2>
        <div className="grid max-w-md gap-3">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Accent Color</p>
            <ColorPickerField
              labels={colorPickerLabels}
              value={accentColor}
              onValueChange={setAccentColor}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Overlay Color</p>
            <ColorPickerField
              labels={colorPickerLabels}
              opacityEnabled
              value={overlayColor}
              onValueChange={setOverlayColor}
            />
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>

      {/* Avatars */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Avatars</h2>
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="https://github.com/vercel.png" alt="@vercel" />
            <AvatarFallback>VR</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
