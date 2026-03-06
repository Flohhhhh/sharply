"use client";

import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

type Burst = {
  id: string;
  x: number;
  y: number;
};

const COLORS = [
  "#22c55e",
  "#eab308",
  "#3b82f6",
  "#ef4444",
  "#a855f7",
  "#f97316",
  "#14b8a6",
  "#ec4899",
  "#84cc16",
  "#06b6d4",
] as const;

export default function BingoConfettiLayer(props: {
  bursts: Burst[];
  fullscreenBursts: string[];
  onBurstComplete: (id: string) => void;
  onFullscreenBurstComplete: (id: string) => void;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {props.bursts.map((burst) => (
        <ReactConfetti
          key={burst.id}
          width={size.width}
          height={size.height}
          numberOfPieces={45}
          recycle={false}
          gravity={0.22}
          initialVelocityY={24}
          initialVelocityX={6}
          tweenDuration={200}
          tweenFunction={(
            currentTime,
            currentValue,
            targetValue,
            duration,
            s,
          ) => {
            return currentValue + (targetValue - currentValue) * (s ?? 0.5);
          }}
          friction={0.97}
          colors={[...COLORS]}
          confettiSource={{
            x: burst.x - 18,
            y: burst.y - 18,
            w: 36,
            h: 36,
          }}
          onConfettiComplete={() => props.onBurstComplete(burst.id)}
        />
      ))}
      {props.fullscreenBursts.map((id) => (
        <ReactConfetti
          key={id}
          width={size.width}
          height={size.height}
          numberOfPieces={420}
          recycle={false}
          gravity={0.18}
          initialVelocityY={20}
          initialVelocityX={9}
          tweenDuration={340}
          friction={0.985}
          colors={[...COLORS]}
          onConfettiComplete={() => props.onFullscreenBurstComplete(id)}
        />
      ))}
    </div>
  );
}
