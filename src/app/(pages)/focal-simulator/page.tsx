import type { Metadata } from "next";
import FocalSimulatorClient from "./client";

export const metadata: Metadata = {
  title: "Focal Length Simulator",
  openGraph: {
    title: "Focal Length Simulator",
  },
};

export default function Page() {
  return <FocalSimulatorClient />;
}
