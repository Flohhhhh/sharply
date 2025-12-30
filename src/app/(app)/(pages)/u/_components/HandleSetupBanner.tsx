"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, PenTool, Signature } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";

export function HandleSetupBanner() {
  return (
    <Alert className="mb-8 rounded-xl border-blue-500/50 bg-blue-500/10">
      <AlertCircle className="h-4 w-4" />
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <AlertTitle className="text-primary text-base font-bold">
            Choose your unique handle
          </AlertTitle>
          <AlertDescription className="text-base">
            You are currently using a default handle. Choose your unique handle
            to make your profile easier to share.
          </AlertDescription>
        </div>
        <Button asChild icon={<PenTool />}>
          <Link href="/profile/settings">Choose handle</Link>
        </Button>
      </div>
    </Alert>
  );
}
