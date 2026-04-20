"use client";

import { useSession } from "~/lib/auth/auth-client";
import { requireRole } from "~/lib/auth/auth-helpers";
import { ManageCreatorVideosModal } from "./manage-creator-videos-modal";

export function CreatorVideosEmptyState({ slug }: { slug: string }) {
  const { data, isPending, error } = useSession();

  if (!data || isPending || error || !requireRole(data.user, ["EDITOR"])) {
    return null;
  }

  return (
    <section id="creator-videos" className="scroll-mt-24 space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">From Respected Creators</h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Add curated creator videos that help show how this item behaves in
            real use, whether that is technical testing, field work,
            impressions, or more narrative coverage centered on the gear.
          </p>
        </div>

        <ManageCreatorVideosModal slug={slug} />
      </div>
    </section>
  );
}
