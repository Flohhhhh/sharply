import { BADGE_CATALOG } from "~/lib/badges/catalog";

export async function BadgesCatalog() {
  const items = BADGE_CATALOG;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground text-left text-xs">
            <th className="py-2 pr-4">Key</th>
            <th className="py-2 pr-4">Label</th>
            <th className="py-2 pr-4">Family</th>
            <th className="py-2 pr-4">Triggers</th>
            <th className="py-2 pr-4">Sort</th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.key} className="border-border border-t">
              <td className="py-2 pr-4 font-mono text-xs">{b.key}</td>
              <td className="py-2 pr-4">{b.label}</td>
              <td className="py-2 pr-4">{b.family}</td>
              <td className="py-2 pr-4">{b.triggers.join(", ")}</td>
              <td className="py-2 pr-4">{b.sortScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
