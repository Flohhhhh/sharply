import Link from "next/link";
import { db } from "~/server/db";
import { gear, gearEdits } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { formatPrice } from "~/lib/mapping";
import { sensorNameFromSlug } from "~/lib/mapping/sensor-map";
import { humanizeKey, formatHumanDate } from "~/lib/utils";

interface EditSuccessPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function EditSuccessPage({
  searchParams,
}: EditSuccessPageProps) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Submission received</h1>
        <p className="text-muted-foreground mt-2">
          Your suggestion was submitted. We couldn't find an edit id in the URL,
          but you can go back to browsing.
        </p>
        <div className="mt-6">
          <Link href="/" className="text-primary text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const rows = await db
    .select({
      id: gearEdits.id,
      createdAt: gearEdits.createdAt,
      status: gearEdits.status,
      payload: gearEdits.payload,
      gearId: gearEdits.gearId,
      gearName: gear.name,
      gearSlug: gear.slug,
      gearType: gear.gearType,
    })
    .from(gearEdits)
    .leftJoin(gear, eq(gearEdits.gearId, gear.id))
    .where(eq(gearEdits.id, id))
    .limit(1);

  const edit = rows[0];

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-6">
        {edit?.gearSlug ? (
          <Link
            href={`/gear/${edit.gearSlug}`}
            className="text-primary text-sm"
          >
            ← Back to {edit.gearName}
          </Link>
        ) : (
          <Link href="/" className="text-primary text-sm">
            ← Back to home
          </Link>
        )}
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Thanks for your suggestion!</h1>
        <p className="text-muted-foreground">Submission ID: {id}</p>
        {edit?.status ? (
          <p className="text-muted-foreground">Current status: {edit.status}</p>
        ) : null}
        {edit?.status === "PENDING" && (
          <p className="text-muted-foreground">
            Your submission has been queued for review by our moderators. You’ll
            be notified if it’s approved or if we need more details.
          </p>
        )}
        {edit?.status === "APPROVED" && (
          <p className="text-muted-foreground">
            Your suggestion was approved and applied to the gear page. Thank you
            for contributing!
          </p>
        )}
        {edit?.status === "REJECTED" && (
          <p className="text-muted-foreground">
            Your suggestion was reviewed but not approved. You can submit
            another update from the gear page.
          </p>
        )}
        {edit?.status === "MERGED" && (
          <p className="text-muted-foreground">
            This submission was merged into another approved edit for the same
            gear.
          </p>
        )}

        {/* Payload preview */}
        {!!edit?.payload && (
          <div className="bg-muted/40 border-border space-y-2 rounded-md border p-3 text-sm">
            {Object.keys(edit.payload as any).length === 0 ? (
              <p className="text-muted-foreground">No changes detected.</p>
            ) : (
              <>
                {(edit.payload as any).core && (
                  <div>
                    <div className="mb-1 font-medium">Core</div>
                    <ul className="list-disc pl-5">
                      {Object.entries((edit.payload as any).core).map(
                        ([k, v]) => {
                          let display: string = String(v as any);
                          if (k === "msrpUsdCents")
                            display = formatPrice(v as number);
                          if (k === "releaseDate")
                            display = formatHumanDate(v as any);
                          return (
                            <li key={String(k)}>
                              <span className="text-muted-foreground">
                                {humanizeKey(String(k))}:
                              </span>{" "}
                              <span className="font-medium">{display}</span>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </div>
                )}
                {(edit.payload as any).camera && (
                  <div>
                    <div className="mb-1 font-medium">Camera</div>
                    <ul className="list-disc pl-5">
                      {Object.entries((edit.payload as any).camera).map(
                        ([k, v]) => {
                          let display: string = String(v as any);
                          if (k === "sensorFormatId")
                            display = sensorNameFromSlug(v as string);
                          return (
                            <li key={String(k)}>
                              <span className="text-muted-foreground">
                                {humanizeKey(String(k))}:
                              </span>{" "}
                              <span className="font-medium">{display}</span>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </div>
                )}
                {(edit.payload as any).lens && (
                  <div>
                    <div className="mb-1 font-medium">Lens</div>
                    <ul className="list-disc pl-5">
                      {Object.entries((edit.payload as any).lens).map(
                        ([k, v]) => (
                          <li key={String(k)}>
                            <span className="text-muted-foreground">
                              {String(k)}:
                            </span>{" "}
                            <span className="font-medium">{String(v)}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <ul className="text-muted-foreground list-disc pl-6">
          {edit?.status === "PENDING" && (
            <li>Edits are typically reviewed within 24–72 hours.</li>
          )}
          <li>You can continue browsing; this page is safe to close.</li>
          <li>
            Want to help more? Submit additional edits from the gear page
            anytime.
          </li>
        </ul>

        {edit?.gearSlug && (
          <div className="pt-2">
            <Link
              href={`/gear/${edit.gearSlug}${edit?.gearType ? `#suggest` : ""}`}
              className="text-primary text-sm"
            >
              Go to gear page
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
