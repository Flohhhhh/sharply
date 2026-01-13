import EditGearClient from "~/app/(app)/(pages)/gear/_components/edit-gear/edit-gear-page-client";
import { fetchGearBySlug } from "~/server/gear/service";
import type { GearItem, GearType } from "~/types/gear";
import { ENUMS } from "~/lib/constants";
import { auth } from "~/auth";
import { fetchPendingEditId } from "~/server/gear/service";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";

interface EditGearPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{ type?: string; showMissingOnly?: string }>;
}

export async function generateMetadata({
  params,
}: EditGearPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item: GearItem = await fetchGearBySlug(slug);
  return {
    title: `Edit ${item.name}`,
    openGraph: {
      title: `Edit ${item.name}`,
    },
  };
}

export default async function EditGearPage({
  params,
  searchParams,
}: EditGearPageProps) {
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

  // Prevent duplicate submissions: redirect back if user already has a pending edit
  if (session?.user) {
    const pendingId = await fetchPendingEditId(slug).catch(() => null);
    if (pendingId) {
      redirect(`/gear/${slug}?editAlreadyPending=1&id=${pendingId}`);
    }
  }

  // Fetch current gear data
  const gearData: GearItem = await fetchGearBySlug(slug);
  const resolvedGearType: GearType =
    (type && (ENUMS.gear_type ?? []).includes(type as GearType)
      ? (type as GearType)
      : (gearData.gearType as GearType)) ?? gearData.gearType;

  // Initialize mountIds for the edit form (prefer new mountIds, fallback to legacy)
  const gearDataWithMountIds = {
    ...gearData,
    gearType: resolvedGearType,
    mountIds:
      Array.isArray(gearData.mountIds) && gearData.mountIds.length > 0
        ? gearData.mountIds
        : gearData.mountId
          ? [gearData.mountId]
          : [],
    // Ensure mountId is set when only array exists so single-select can prefill for cameras
    mountId: gearData.mountId ?? gearData.mountIds?.[0] ?? null,
  };

  // Debug: log incoming data for the edit page
  console.log("[EditGearPage] params", { slug, type });
  console.log("[EditGearPage] gearData summary", {
    id: gearData?.id,
    name: gearData?.name,
    gearType: gearData?.gearType,
    resolvedGearType,
    mountId: gearData?.mountId,
    mountIds: gearDataWithMountIds.mountIds,
    lensSpecs: gearData?.lensSpecs,
    cameraSpecs: gearData?.cameraSpecs,
  });

  return (
    <div className="container mx-auto max-w-4xl p-6 pt-20">
      <EditGearClient
        gearType={resolvedGearType}
        gearData={gearDataWithMountIds}
        gearSlug={slug}
        initialShowMissingOnly={(() => {
          const v = showMissingOnly?.toLowerCase();
          return v === "1" || v === "true" || v === "yes";
        })()}
      />
    </div>
  );
}
