import { GearCardHorizontal } from "~/components/gear/gear-card-horizontal";
import type { GearAlternativeRow } from "~/server/gear/service";

interface GearAlternativesSectionProps {
  alternatives: GearAlternativeRow[];
}

export function GearAlternativesSection({
  alternatives,
}: GearAlternativesSectionProps) {
  if (alternatives.length === 0) {
    return null;
  }

  // Sort competitors first, then by name
  const sorted = [...alternatives].sort((a, b) => {
    if (a.isCompetitor !== b.isCompetitor) {
      return a.isCompetitor ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <section id="alternatives" className="scroll-mt-24">
      <h2 className="mb-2 text-lg font-semibold">Alternatives</h2>
      <div className="grid grid-cols-1 gap-3">
        {sorted.map((alt) => (
          <GearCardHorizontal
            key={alt.gearId}
            href={`/gear/${alt.slug}`}
            slug={alt.slug}
            name={alt.name}
            brandName={alt.brandName}
            thumbnailUrl={alt.thumbnailUrl}
            gearType={alt.gearType}
          />
        ))}
      </div>
    </section>
  );
}
