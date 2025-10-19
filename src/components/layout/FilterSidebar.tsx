export default function FilterSidebar({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="border-border bg-card/50 rounded-md border p-3">
      {children ?? (
        <div className="text-muted-foreground text-sm">Filters go here</div>
      )}
    </div>
  );
}
