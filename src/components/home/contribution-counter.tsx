import { fetchContributionCount } from "~/server/metrics/service";
import { ContributionCounterValue } from "./contribution-counter-value";

export async function ContributionCounter() {
  const totalContributions = await fetchContributionCount();

  return (
    <div className="space-y-2">
      <ContributionCounterValue
        value={totalContributions}
        className="text-5xl font-bold"
      />
      <p className="text-muted-foreground py-0 text-sm leading-0">
        Contributions by members
      </p>
    </div>
  );
}
