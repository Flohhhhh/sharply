import Link from "next/link";
import { fetchGearEditById } from "~/server/gear/service";
import { formatPrice } from "~/lib/mapping";
import { sensorNameFromSlug } from "~/lib/mapping/sensor-map";
import { humanizeKey, formatHumanDate } from "~/lib/utils";
import { auth, requireRole } from "~/server/auth";

interface EditSuccessPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function EditSuccessPage({
  searchParams,
}: EditSuccessPageProps) {
  const { id } = await searchParams;
  const session = await auth();
  const isAdmin = requireRole(session, ["ADMIN"]);

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
          {isAdmin ? (
            <div className="mt-2">
              <Link href="/admin" className="text-primary text-sm">
                → Open admin
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const edit = await fetchGearEditById(id);

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
                          if (
                            k === "msrpUsdCents" ||
                            k === "msrpNowUsdCents" ||
                            k === "msrpAtLaunchUsdCents"
                          )
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
                {Array.isArray((edit.payload as any).cameraCardSlots) && (
                  <div>
                    <div className="mb-1 font-medium">Card Slots</div>
                    <ul className="list-disc pl-5">
                      {((edit.payload as any).cameraCardSlots as any[]).map(
                        (s, i) => {
                          const ff = Array.isArray(s.supportedFormFactors)
                            ? (s.supportedFormFactors as string[]).join(", ")
                            : "";
                          const buses = Array.isArray(s.supportedBuses)
                            ? (s.supportedBuses as string[]).join(", ")
                            : "";
                          const speeds = Array.isArray(s.supportedSpeedClasses)
                            ? (s.supportedSpeedClasses as string[]).join(", ")
                            : "";
                          const details = [ff, buses, speeds]
                            .filter(Boolean)
                            .join(" | ");
                          return (
                            <li key={i}>
                              <span className="text-muted-foreground">
                                Slot {s.slotIndex}:
                              </span>{" "}
                              <span className="font-medium">{details}</span>
                            </li>
                          );
                        },
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
        {isAdmin ? (
          <div className="pt-2">
            <Link href="/admin" className="text-primary text-sm">
              Open admin dashboard
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
