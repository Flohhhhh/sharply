import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Bulk Create",
  openGraph: {
    title: "Bulk Create",
  },
};

export default function Page() {
  redirect("/admin/gear");
}
