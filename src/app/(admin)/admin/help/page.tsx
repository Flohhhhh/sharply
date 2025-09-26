import Link from "next/link";
import { auth } from "~/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export const metadata = { title: "Help • Admin" } as const;

export default async function AdminHelpPage() {
  const session = await auth();
  const role = session?.user?.role ?? "USER";

  return (
    <div className="space-y-8 px-2 md:px-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Help</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          A quick guide to approvals and gear management in Sharply.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What is Sharply?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Sharply is a photography gear database and catalog. We track
            cameras, lenses, mounts, sensor formats, and more — with structured
            specs, reviews, and search.
          </p>
          <p>
            Admins and editors help keep the catalog accurate by approving
            user-submitted edits, creating new gear, and curating reviews.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gear edits (Approvals)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            The Approvals dashboard groups edit proposals by gear item. Within a
            group, fields that don’t conflict are merged automatically. When
            multiple proposals suggest different values for the same field, they
            appear as conflicts and you must choose one value per field (or skip
            it) before approving.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium">Grouping:</span> proposals are
              grouped per gear item to review all pending changes together.
            </li>
            <li>
              <span className="font-medium">Non-conflicting changes:</span>{" "}
              applied by default; you can deselect any individual field.
            </li>
            <li>
              <span className="font-medium">Conflicts:</span> select which
              proposal supplies the value for each conflicting field, or choose
              “Skip” to omit that field.
            </li>
            <li>
              <span className="font-medium">Approve Selected:</span> applies
              your chosen values and resolves all pending proposals in the
              group.
            </li>
          </ul>
          <p className="text-muted-foreground">
            Tip: Card slot details are treated as a single field; if proposals
            differ, pick one or skip it.
          </p>
          <p>
            Go to{" "}
            <Link href="/admin" className="underline">
              Approvals
            </Link>{" "}
            to get started.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review approvals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Approving a user review publishes it on the gear page. Behind the
            scenes, approval can grant contributor badges and may trigger
            generation of a summary for the gear’s reviews.
          </p>
          <p>
            Find these in{" "}
            <Link href="/admin" className="underline">
              Approvals
            </Link>{" "}
            under the Reviews section.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gear creation (single item)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Open the sidebar and click{" "}
              <span className="font-medium">Create Gear Item</span>.
            </li>
            <li>Select a brand and type (Camera or Lens).</li>
            <li>
              Enter the exact product name; optionally add the model number and
              links.
            </li>
            <li>Resolve any blocking conflicts detected by pre‑check.</li>
            <li>
              Click <span className="font-medium">Create</span>.
            </li>
          </ol>
          <div className="space-y-2">
            <div className="font-medium">How deduplication works</div>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium">Hard conflicts (blockers):</span>{" "}
                exact slug or model number match — must resolve before creating.
              </li>
              <li>
                <span className="font-medium">Fuzzy matches:</span> similar
                existing items are shown for review; you may proceed after
                confirming it isn’t a duplicate.
              </li>
              <li>
                <span className="font-medium">Soft naming warnings:</span>{" "}
                guidance like adding “Nikkor” for Nikon lenses or including
                focal length/aperture. You can proceed after acknowledging.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {role === "ADMIN" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Bulk creator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                A bulk creator for adding many items at once is available on{" "}
                <Link href="/admin/gear" className="underline">
                  /admin/gear
                </Link>
                .
              </p>
              <p className="text-muted-foreground">
                Note: Bulk create is visible to admins. It uses the same
                pre‑check logic for each row (hard conflicts, fuzzy matches,
                soft warnings) and supports batch submission.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Admin‑only notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc space-y-1 pl-5">
                {/* <li>
                Create invite links at{" "}
                <Link href="/admin/private" className="underline">
                  /admin/private
                </Link>{" "}
                to onboard editors or admins.
              </li> */}
                <li>
                  Advanced utilities live under{" "}
                  <Link href="/admin/tools" className="underline">
                    /admin/tools
                  </Link>{" "}
                  and analytics under{" "}
                  <Link href="/admin/analytics" className="underline">
                    /admin/analytics
                  </Link>
                  .
                </li>
                <li>
                  The bulk creator on{" "}
                  <Link href="/admin/gear" className="underline">
                    /admin/gear
                  </Link>{" "}
                  is admin‑only.
                </li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
