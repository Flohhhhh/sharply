"use client";

import { useSession } from "~/lib/auth/auth-client";
import { requireRole } from "~/lib/auth/auth-helpers";
import { ManageStaffVerdictModal } from "./manage-staff-verdict-modal";

export function StaffVerdictEmptyState({ slug }: { slug: string }) {
  const { data, isPending, error } = useSession();
  if (!data || isPending || error) return null;

  const session = data.session;
  const user = data.user;
  if (!session || !user) return null;

  const isAdmin = requireRole(user, ["ADMIN"]);
  if (!isAdmin) return null;

  return (
    <section id="staff-verdict" className="mt-12 scroll-mt-24 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Staff Verdict</h3>
        <ManageStaffVerdictModal slug={slug} />
      </div>
    </section>
  );
}
