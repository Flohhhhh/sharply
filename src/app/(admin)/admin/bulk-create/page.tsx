import type { Metadata } from "next";
import GearBulkCreate from "../gear-bulk-create";

export const metadata: Metadata = {
  title: "Bulk Create • Admin",
};

export default function Page() {
  return <GearBulkCreate />;
}
