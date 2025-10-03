import { Suspense } from "react";
import { BadgesTestToastButton } from "../badges-test-toast";
import { BadgesCatalog } from "../badges-catalog";
import { AdminImageUploader } from "../admin-image-uploader";

export default function ToolsPage() {
  return (
    <div className="space-y-8 px-8">
      <div>
        <h2 className="text-2xl font-bold">Image Uploader (Admin)</h2>
        <p className="text-muted-foreground mt-2">
          Temporary admin tool to upload images via UploadThing.
        </p>
        <div className="mt-4">
          <AdminImageUploader />
        </div>
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
    </div>
  );
}
