export default function MountList({
  brandName,
  category,
  mountShort,
  total,
}: {
  brandName: string;
  category: string;
  mountShort: string;
  total: number;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold">
        {brandName} / {category} / {mountShort.toUpperCase()}
      </h2>
      <p className="text-muted-foreground text-sm">Results: {total}</p>
    </section>
  );
}
