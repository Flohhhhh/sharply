import { NumberTicker } from "~/components/magicui/number-ticker";
import { fetchGearCount } from "~/server/metrics/service";

export async function GearCounter() {
  const totalGearItems = await fetchGearCount();

  return (
    <div>
      <NumberTicker value={totalGearItems} className="text-6xl font-bold" />
      <p className="text-muted-foreground text-sm">Items in our database</p>
    </div>
  );
}
