export type Scene = {
  id: string;
  label: string;
  src: string;
  baseFocalMm: number;
  aspectHint?: "16:9" | "3:2" | "4:3";
};

export const SCENES: Scene[] = [
  {
    id: "city-24mm",
    label: "City street (wide)",
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600&auto=format&fit=crop",
    baseFocalMm: 24,
    aspectHint: "3:2",
  },
  {
    id: "portrait-85mm",
    label: "Portrait (85mm)",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1600&auto=format&fit=crop",
    baseFocalMm: 85,
    aspectHint: "3:2",
  },
  {
    id: "landscape-35mm",
    label: "Landscape (35mm)",
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
    baseFocalMm: 35,
    aspectHint: "3:2",
  },
];
