import Link from "next/link";
import { Wrench } from "lucide-react";

export function ConstructionFullPage(props: {
  gearName: string;
  missing: string[];
  editHref: string;
  isLoggedIn: boolean;
}) {
  const { gearName, missing, editHref, isLoggedIn } = props;
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-10 text-center">
      <Wrench className="text-muted-foreground h-16 w-16" aria-hidden="true" />
      <h1 className="text-4xl font-semibold tracking-tight">{gearName}</h1>
      <p className="text-muted-foreground text-base">
        This page is under construction!
      </p>

      {isLoggedIn ? (
        <Link
          href={editHref}
          scroll={false}
          className="text-primary text-sm font-medium hover:underline"
        >
          Want to help?
        </Link>
      ) : (
        <Link
          href="/api/auth/signin"
          className="text-primary text-sm font-medium hover:underline"
        >
          Sign in to help
        </Link>
      )}

      {!isLoggedIn && (
        <div className="mt-4 max-w-xl text-left">
          <h2 className="mb-2 text-sm font-semibold">
            How crowdsourcing works
          </h2>
          <p className="text-muted-foreground text-sm">
            Sharply is a contributor-driven gear database with controlled
            crowdsourcing. Members propose updates to technical specs, which are
            reviewed before going live. Approved contributions are credited on
            the page and count toward contributor recognition.
          </p>
          <ul className="text-muted-foreground mt-2 list-disc pl-5 text-sm">
            <li>Find missing or inaccurate specs and suggest an edit</li>
            <li>Edits are reviewed for accuracy before publishing</li>
            <li>
              Get credit for approved contributions and build your profile
            </li>
          </ul>
        </div>
      )}

      {missing.length > 0 && (
        <div className="mt-6 max-w-xl text-left">
          <div className="mb-1 text-sm">
            We're missing the following key specs:
          </div>
          <ul className="text-muted-foreground list-disc pl-5 text-sm">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <Link href="/gear" className="text-primary text-sm">
          ← Back to Gear
        </Link>
      </div>
    </div>
  );
}
