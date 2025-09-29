import type { Metadata } from "next";
import VerifyClient from "./client";

export const metadata: Metadata = {
  title: "Verify Email",
  openGraph: {
    title: "Verify Email",
  },
};

export default function Page() {
  return <VerifyClient />;
}
