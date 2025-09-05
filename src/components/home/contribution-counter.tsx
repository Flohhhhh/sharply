import { NumberTicker } from "~/components/magicui/number-ticker";
import { fetchContributionCount } from "~/server/metrics/service";

export async function ContributionCounter() {
  const totalContributions = await fetchContributionCount();

  return (
    <div>
      <NumberTicker value={totalContributions} className="text-5xl font-bold" />
      <p className="text-muted-foreground">Contributions by members</p>
    </div>
  );
}
