import { EditGearForm } from "~/app/(pages)/gear/_components/edit-gear/edit-gear-form";
import { fetchGearBySlug } from "~/server/gear/service";
import type { GearItem } from "~/types/gear";
import { auth } from "~/server/auth";
import { fetchPendingEditId } from "~/server/gear/service";
import { redirect } from "next/navigation";

interface EditGearPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function EditGearPage({
  params,
  searchParams,
}: EditGearPageProps) {
  const [{ slug }, { type }] = await Promise.all([params, searchParams]);

  // Require authentication: if not signed in, send to login and return here
  const session = await auth();
  if (!session?.user?.id) {
    const editUrl = `/gear/${slug}/edit${type ? `?type=${type}` : ""}`;
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(editUrl)}`);
  }

  // Prevent duplicate submissions: redirect back if user already has a pending edit
  if (session?.user?.id) {
    const pendingId = await fetchPendingEditId(slug).catch(() => null);
    if (pendingId) {
      redirect(`/gear/${slug}?editAlreadyPending=1&id=${pendingId}`);
    }
  }

  // Fetch current gear data
  const gearData: GearItem = await fetchGearBySlug(slug);

  // Debug: log incoming data for the edit page
  console.log("[EditGearPage] params", { slug, type });
  console.log("[EditGearPage] gearData summary", {
    id: gearData?.id,
    name: gearData?.name,
    gearType: gearData?.gearType,
    mountId: gearData?.mountId,
    lensSpecs: gearData?.lensSpecs,
    cameraSpecs: gearData?.cameraSpecs,
  });

  return (
    <div className="container mx-auto max-w-4xl p-6 pt-20">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit Gear: {gearData?.name}</h1>
        <p className="text-muted-foreground">
          Suggest changes to gear specifications for review
        </p>
      </div>
      <EditGearForm
        gearType={type as "CAMERA" | "LENS"}
        gearData={gearData}
        gearSlug={slug}
      />
    </div>
  );
}
