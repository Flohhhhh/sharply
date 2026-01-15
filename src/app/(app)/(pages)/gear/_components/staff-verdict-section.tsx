import { ManageStaffVerdictModal } from "./manage-staff-verdict-modal";
import { StaffVerdictEmptyState } from "./staff-verdict-empty-state";

interface StaffVerdict {
  content?: string | null;
  pros?: unknown;
  cons?: unknown;
  whoFor?: string | null;
  notFor?: string | null;
  alternatives?: unknown;
}

export async function StaffVerdictSection({
  slug,
  verdict,
}: {
  slug: string;
  verdict: StaffVerdict | null;
}) {
  const hasVerdict = Boolean(
    verdict &&
    (verdict.content ||
      verdict.pros ||
      verdict.cons ||
      verdict.whoFor ||
      verdict.notFor ||
      verdict.alternatives),
  );

  if (!hasVerdict || !verdict) {
    return <StaffVerdictEmptyState slug={slug} />;
  }

  const pros = Array.isArray(verdict.pros) ? (verdict.pros as string[]) : null;
  const cons = Array.isArray(verdict.cons) ? (verdict.cons as string[]) : null;
  const alternatives = Array.isArray(verdict.alternatives)
    ? (verdict.alternatives as string[])
    : null;

  return (
    <section id="staff-verdict" className="scroll-mt-24 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Staff Verdict</h3>
        <ManageStaffVerdictModal slug={slug} />
      </div>

      <div className="overflow-hidden">
        {verdict.content && (
          <div className="space-y-2">
            {verdict.content.split("\n").map((p: string, i: number) =>
              p.trim() ? (
                <p key={i} className="text-sm leading-relaxed opacity-80">
                  {p}
                </p>
              ) : (
                <br key={i} />
              ),
            )}
          </div>
        )}

        {(Array.isArray(pros) && pros.length > 0) ||
        (Array.isArray(cons) && cons.length > 0) ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {Array.isArray(pros) && pros.length > 0 && (
              <div className="rounded border border-green-400/50 bg-green-400/5 p-3">
                <div className="text-lg font-semibold">The Good</div>
                <ul className="my-3 list-disc space-y-2 pl-5 text-sm text-green-600 dark:text-green-400">
                  {pros.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(cons) && cons.length > 0 && (
              <div className="rounded border border-red-400/50 bg-red-400/5 p-3">
                <div className="text-lg font-semibold">The Bad</div>
                <ul className="my-3 list-disc space-y-2 pl-5 text-sm text-red-600 dark:text-red-400">
                  {cons.map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {(verdict.whoFor || verdict.notFor) && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {verdict.whoFor && (
              <div className="border-border rounded border p-3">
                <div className="text-lg font-semibold">Who it's for</div>
                <p className="mt-4 text-sm leading-relaxed">{verdict.whoFor}</p>
              </div>
            )}
            {verdict.notFor && (
              <div className="border-border rounded border p-3">
                <div className="text-lg font-semibold">Who it's not for</div>
                <p className="mt-4 text-sm leading-relaxed">{verdict.notFor}</p>
              </div>
            )}
          </div>
        )}

        {Array.isArray(alternatives) && alternatives.length > 0 && (
          <div className="mt-4">
            <div className="text-lg font-semibold">Top alternatives</div>
            <ul className="list-disc pl-5 text-sm">
              {alternatives.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
