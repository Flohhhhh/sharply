import Link from "next/link";

export function ConstructionFullPage(props: {
  gearName: string;
  missing: string[];
  editHref: string;
  isLoggedIn: boolean;
}) {
  const { gearName, missing, editHref, isLoggedIn } = props;
  return (
    <div className="space-y-6">
      <div className="border-border rounded-md border bg-amber-50/70 p-5 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="mb-2 text-sm">{gearName}</div>
        <h1 className="mb-2 text-xl font-semibold">
          This page is under construction!
        </h1>
        {missing.length > 0 && (
          <div className="mb-4 text-sm">
            <div className="mb-1">We're missing the following key specs:</div>
            <ul className="list-disc pl-5">
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        {isLoggedIn ? (
          <Link
            href={editHref}
            scroll={false}
            className="bg-primary hover:bg-primary/90 text-primary-foreground inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            Click here to contribute the information needed
          </Link>
        ) : (
          <Link
            href="/api/auth/signin"
            className="bg-primary hover:bg-primary/90 text-primary-foreground inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            Sign in to contribute information
          </Link>
        )}
      </div>
      <div>
        <Link href="/gear" className="text-primary text-sm">
          ← Back to Gear
        </Link>
      </div>
    </div>
  );
}
