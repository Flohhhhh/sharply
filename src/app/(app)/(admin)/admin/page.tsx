import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FileText, Users, Settings } from "lucide-react";
import { GearProposalsList } from "./gear-proposals-list";
import { ReviewsApprovalQueue } from "./reviews-approval-queue";
import { BadgesCatalog } from "./badges-catalog";
import { BadgesTestToastButton } from "./badges-test-toast";
import { TopComparePairs } from "./top-compare-pairs";
import { AdminImageUploader } from "./admin-image-uploader";
import { fetchGearProposals } from "~/server/admin/proposals/service";
import { fetchAdminReviews } from "~/server/admin/reviews/service";
import type { GearEditProposal } from "~/types/gear";
import { auth } from "~/server/auth";

export default async function AdminPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return <div>Unauthenticated</div>;
  }

  return (
    <div className="space-y-8 px-8">
      {/* Single-gear creation moved to modal trigger in the sidebar */}
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
