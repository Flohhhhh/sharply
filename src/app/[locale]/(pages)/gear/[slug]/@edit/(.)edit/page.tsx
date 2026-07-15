import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EditAlreadyPendingRedirect } from "~/app/[locale]/(pages)/gear/_components/edit-already-pending-redirect";
import { EditGearModal } from "~/app/[locale]/(pages)/gear/_components/edit-gear/edit-gear-modal";
import { auth } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import { fetchGearBySlug,fetchPendingEditId } from "~/server/gear/service";
import type { GearItem } from "~/types/gear";

interface EditGearModalPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{ type?: string; showMissingOnly?: string }>;
}

export default async function EditGearModalPage({
  params,
  searchParams,
}: EditGearModalPageProps) {
  const [{ slug }, { type, showMissingOnly }] = await Promise.all([
    params,
    searchParams,
  ]);

  // Require authentication: if not signed in, send to login and return here
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    const editUrl = `/gear/${slug}/edit${type ? `?type=${type}` : ""}`;
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(editUrl)}`);
  }

  // Prevent duplicate submissions: if user already has a pending edit for this
  // gear, render a client component that navigates back and shows a toast.
  // NOTE: Do NOT use server-side `redirect()` here — it causes a runaway
  // request loop because Next.js re-fetches parallel-route interception slots
  // on every prefetch/soft-nav, and each fetch triggers a new redirect.
  if (session?.user) {
    const pendingId = await fetchPendingEditId(slug).catch(() => null);
    if (pendingId) {
      return <EditAlreadyPendingRedirect slug={slug} pendingId={pendingId} />;
    }
  }

  // Fetch current gear data
  const gearDataResult: GearItem = await fetchGearBySlug(slug, {
    includeRumored: true,
    includeHidden: true,
  });

  console.log("[EditGearModalPage] gearDataResult", gearDataResult);

  // Validate and set default gear type
  // const gearType = type === "CAMERA" || type === "LENS" ? type : gearDataResult.gearType;

  // Create gearData object outside of JSX to prevent recreation on every render
  const gearData = gearDataResult
    ? {
        ...gearDataResult,
        cameraSpecs: gearDataResult.cameraSpecs || null,
        lensSpecs: gearDataResult.lensSpecs || null,
      }
    : ({} as GearItem);

  return (
    <EditGearModal
      canToggleAutoSubmit={requireRole(session.user, ["EDITOR"])}
      gearType={gearDataResult.gearType}
      gearData={gearData}
      gearSlug={slug}
      gearName={gearData.name || ""}
      initialShowMissingOnly={(() => {
        const v = showMissingOnly?.toLowerCase();
        return v === "1" || v === "true" || v === "yes";
      })()}
    />
  );
}
