import type { Metadata } from "next";
import VerifyOtpClient from "./client";

export const metadata: Metadata = {
  title: "Verify Code",
  openGraph: {
    title: "Verify Code",
  },
};

export default function VerifyOtpPage() {
  return <VerifyOtpClient />;
}
