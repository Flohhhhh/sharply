import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EditAlreadyPendingRedirect } from "~/app/[locale]/(pages)/gear/_components/edit-already-pending-redirect";
import EditGearClient from "~/app/[locale]/(pages)/gear/_components/edit-gear/edit-gear-page-client";
import { auth } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import { ENUMS } from "~/lib/constants";
import { fetchGearBySlug,fetchPendingEditId } from "~/server/gear/service";
import type { GearItem,GearType } from "~/types/gear";

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
  const item: GearItem = await fetchGearBySlug(slug, {
    includeRumored: true,
    includeHidden: true,
  });
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

  // Prevent duplicate submissions: if user already has a pending edit,
  // render a client component that navigates back and shows a toast.
  // NOTE: Do NOT use server-side `redirect()` here — in the intercepting
  // route variant this causes a runaway request loop; keep both routes
  // consistent to avoid the same class of issue on hard navigations.
  if (session?.user) {
    const pendingId = await fetchPendingEditId(slug).catch(() => null);
    if (pendingId) {
      return <EditAlreadyPendingRedirect slug={slug} pendingId={pendingId} />;
    }
  }

  // Fetch current gear data
  const gearData: GearItem = await fetchGearBySlug(slug, {
    includeRumored: true,
    includeHidden: true,
  });
  const resolvedGearType: GearType =
    (type && (ENUMS.gear_type ?? []).includes(type as GearType)
      ? (type as GearType)
      : (gearData.gearType)) ?? gearData.gearType;

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
        canToggleAutoSubmit={requireRole(session.user, ["EDITOR"])}
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
