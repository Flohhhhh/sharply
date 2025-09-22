import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FileText, Users, Settings } from "lucide-react";
import { GearProposalsList } from "./gear-proposals-list";
import { AuditLogList } from "./admin-audit-log-list";
import { GearCreateCard } from "./gear-create";
import { ReviewsApprovalQueue } from "./reviews-approval-queue";
import { RollupRunsList } from "./rollup-runs-list";
import { BadgesCatalog } from "./badges-catalog";
import { BadgesTestToastButton } from "./badges-test-toast";
import { BadgesAwardsList } from "./badges-awards-list";
import { TopComparePairs } from "./top-compare-pairs";
import { AdminImageUploader } from "./admin-image-uploader";
import { fetchGearProposals } from "~/server/admin/proposals/service";
import { fetchAdminReviews } from "~/server/admin/reviews/service";
import type { GearEditProposal } from "~/types/gear";

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your platform's content and users.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Image Uploader (Admin)</h2>
        <p className="text-muted-foreground mt-2">
          Temporary admin tool to upload images via UploadThing.
        </p>
        <div className="mt-4">
          <AdminImageUploader />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Create Gear</h2>
        <p className="text-muted-foreground mt-2">
          Quick-create a new gear item with name, brand and type.
        </p>
        <div className="mt-4">
          <GearCreateCard />
        </div>
      </div>

      {/* Quick Stats Cards */}
      {/* <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gear Proposals
            </CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Review & Approve</div>
            <p className="text-muted-foreground text-xs">
              Manage gear specification changes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manage</div>
            <p className="text-muted-foreground text-xs">
              User accounts and permissions
            </p>
            <Button className="mt-2 w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settings</CardTitle>
            <Settings className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Configure</div>
            <p className="text-muted-foreground text-xs">
              Platform configuration
            </p>
            <Button className="mt-2 w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div> */}

      {/* Audit Logs */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">Audit Logs</h2>
          <p className="text-muted-foreground mt-2">
            Recent admin actions with links to affected items.
          </p>
        </div>
        <Suspense fallback={<div>Loading audit logs...</div>}>
          <AuditLogList />
        </Suspense>
      </div>

      {/* Gear Proposals Tool */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Gear Edit Proposals</h2>
          <p className="text-muted-foreground mt-2">
            Review and manage gear specification change proposals from
            contributors.
          </p>
        </div>

        <Suspense fallback={<div>Loading proposals...</div>}>
          <GearProposalsWrapper />
        </Suspense>
      </div>

      {/* Reviews Approval Queue */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">User Reviews – Approval Queue</h2>
          <p className="text-muted-foreground mt-2">
            Approve or reject user-submitted reviews.
          </p>
        </div>
        <Suspense fallback={<div>Loading reviews...</div>}>
          <ReviewsApprovalWrapper />
        </Suspense>
      </div>

      {/* Recent Badge Awards */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">Recent Badge Awards</h2>
          <p className="text-muted-foreground mt-2">
            Latest awarded badges across the platform.
          </p>
        </div>
        <Suspense fallback={<div>Loading awards...</div>}>
          <BadgesAwardsList />
        </Suspense>
      </div>

      {/* Badge Catalog */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">Badge Catalog</h2>
          <p className="text-muted-foreground mt-2">
            All defined badges with triggers and sort metadata.
          </p>
        </div>
        <div>
          <BadgesTestToastButton />
        </div>
        <Suspense fallback={<div>Loading catalog...</div>}>
          <BadgesCatalog />
        </Suspense>
      </div>

      {/* Rollup Runs */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">Popularity Rollup Runs</h2>
          <p className="text-muted-foreground mt-2">
            Recent rollup history and metrics.
          </p>
        </div>
        <Suspense fallback={<div>Loading rollup runs...</div>}>
          <RollupRunsList />
        </Suspense>
      </div>

      {/* Top Compare Pairs */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">Top Comparison Pairs</h2>
          <p className="text-muted-foreground mt-2">
            Most frequently compared gear pairs (lifetime counter).
          </p>
        </div>
        <Suspense fallback={<div>Loading compare pairs...</div>}>
          <TopComparePairs />
        </Suspense>
      </div>
    </div>
  );
}

async function GearProposalsWrapper() {
  const proposals = await fetchGearProposals();
  return <GearProposalsList initialProposals={proposals} />;
}

async function ReviewsApprovalWrapper() {
  const reviews = await fetchAdminReviews();
  return <ReviewsApprovalQueue initialReviews={reviews} />;
}
