import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Bulk Create • Admin",
};

export default function Page() {
  redirect("/admin/gear");
}
