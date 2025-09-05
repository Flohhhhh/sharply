import { EditGearModal } from "~/app/(pages)/gear/_components/edit-gear/edit-gear-modal";
import { fetchGearBySlug, fetchPendingEditId } from "~/server/gear/service";
import type { GearItem } from "~/types/gear";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

interface EditGearModalPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function EditGearModalPage({
  params,
  searchParams,
}: EditGearModalPageProps) {
  const [{ slug }, { type }] = await Promise.all([params, searchParams]);

  // Require authentication: if not signed in, send to login and return here
  const session = await auth();
  if (!session?.user?.id) {
    const editUrl = `/gear/${slug}/edit${type ? `?type=${type}` : ""}`;
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(editUrl)}`);
  }

  // Prevent duplicate submissions: if user already has a pending edit for this gear,
  // redirect back to gear page with flags to show a toast
  if (session?.user?.id) {
    const pendingId = await fetchPendingEditId(slug).catch(() => null);
    if (pendingId) {
      redirect(`/gear/${slug}?editAlreadyPending=1&id=${pendingId}`);
    }
  }

  // Fetch current gear data
  const gearDataResult: GearItem = await fetchGearBySlug(slug);

  // Validate and set default gear type
  const gearType = type === "CAMERA" || type === "LENS" ? type : "CAMERA";

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
      gearType={gearType}
      gearData={gearData}
      gearSlug={slug}
      gearName={gearData.name || ""}
    />
  );
}
