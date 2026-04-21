import Link from "next/link";
import { fetchGearBySlug } from "~/server/gear/service";

interface SubmittedPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ editId?: string }>;
}

export default async function SubmittedPage({
  params,
  searchParams,
}: SubmittedPageProps) {
  const [{ slug }, { editId }] = await Promise.all([params, searchParams]);
  const gear = await fetchGearBySlug(slug);

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <Link href={`/gear/${slug}`} className="text-primary text-sm">
          ← Back to {gear.name}
        </Link>
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Thanks for your suggestion!</h1>
        {editId ? (
          <p className="text-muted-foreground">Submission ID: {editId}</p>
        ) : null}
        <p className="text-muted-foreground">
          Your submission has been queued for review by our moderators. You’ll
          be notified if it’s approved or if we need more details.
        </p>

        <ul className="text-muted-foreground list-disc pl-6">
          <li>Edits are typically reviewed within 24–72 hours.</li>
          <li>You can continue browsing; this page is safe to close.</li>
          <li>
            Want to help more? Submit additional edits from the gear page
            anytime.
          </li>
        </ul>
      </div>
    </div>
  );
}
