import { NumberTicker } from "~/components/magicui/number-ticker";
import { fetchGearCount } from "~/server/metrics/service";

export async function GearCounter() {
  const totalGearItems = await fetchGearCount();

  return (
    <div className="space-y-2">
      <NumberTicker value={totalGearItems} className="text-5xl font-bold" />
      <p className="text-muted-foreground py-0 text-sm leading-0">
        Items in our database
      </p>
    </div>
  );
}
