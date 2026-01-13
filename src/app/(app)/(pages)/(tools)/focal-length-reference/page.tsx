import type { Metadata } from "next";
import { FocalLengthClient } from "./_components/focal-length-client";

export const metadata: Metadata = {
  title: "Field of View Reference",
  description:
    "See how different focal lengths and sensor sizes affect the field of view with different scenes.",
  openGraph: {
    title: "Field of View Reference",
    description:
      "See how different focal lengths and sensor sizes affect the field of view with different scenes.",
    images: [
      {
        url: "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTndcjXBY9t0HF8TGqsvlIEWRPn6ywJp3XzgAYQ",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function FocalLengthReferencePage() {
  return <FocalLengthClient />;
}
