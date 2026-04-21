import { getMountDisplayName } from "~/lib/mapping/mounts-map";

export default function MountList({
  brandName,
  category,
  mountValue,
  total,
}: {
  brandName: string;
  category: string;
  mountValue: string;
  total: number;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold">
        {brandName} / {category} / {getMountDisplayName(mountValue)}
      </h2>
      <p className="text-muted-foreground text-sm">Results: {total}</p>
    </section>
  );
}
