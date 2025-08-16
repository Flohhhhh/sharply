import Link from "next/link";
import { Wrench } from "lucide-react";
import { Button } from "~/components/ui/button";

export function ConstructionFullPage(props: {
  gearName: string;
  missing: string[];
  editHref: string;
}) {
  const { gearName, missing, editHref } = props;
  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center gap-4 py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          {gearName}
        </h1>
        <Wrench className="text-muted-foreground h-8 w-8" aria-hidden="true" />
      </div>
      <p className="text-muted-foreground text-base">
        This page is under construction!
      </p>

      {missing.length > 0 && (
        <div className="max-w-xl text-left">
          <div className="mb-2 text-sm font-semibold">
            We're missing the following key specs:
          </div>
          <ul className="text-muted-foreground border-muted-foreground/20 list-disc rounded-md border p-2 pl-5 text-sm">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <Button asChild size="sm">
        <Link href={editHref} scroll={false}>
          Contribute to this item!
        </Link>
      </Button>

      <div className="mt-4 max-w-xl text-left">
        <h2 className="mb-2 text-sm font-semibold">
          Sharply is crowd-sourced!
        </h2>
        <p className="text-muted-foreground text-sm">
          We have a contributor-driven gear database with controlled
          crowd-sourcing. Members propose updates to technical specs, which are
          reviewed before going live. Approved contributions are credited on the
          page and count toward contributor recognition.
        </p>
        <ul className="text-muted-foreground mt-2 list-disc pl-5 text-sm">
          <li>Find missing or inaccurate specs and suggest an edit</li>
          <li>Edits are reviewed for accuracy before publishing</li>
          <li>Get credit for approved contributions and build your profile</li>
        </ul>
      </div>

      <div className="mt-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/gear">← Back to Gear</Link>
        </Button>
      </div>
    </div>
  );
}
