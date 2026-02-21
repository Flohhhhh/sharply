import { Suspense } from "react";
import { BadgesTestToastButton } from "../badges-test-toast";
import { BadgesCatalog } from "../badges-catalog";
import { AdminImageUploader } from "../admin-image-uploader";
import { GradientImageTool } from "../gradient-image-tool";
import { SharedListOgPreviewTool } from "../shared-list-og-preview-tool";
import { fetchLiveBoosts } from "~/server/popularity/service";
import Link from "next/link";

export default async function ToolsPage() {
  const liveBoosts = await fetchLiveBoosts({ limit: 100 });
  return (
    <div className="space-y-8 px-8">
      {/* Live Boosts Today */}
      <div>
        <h2 className="text-2xl font-bold">Live Boosts (Today)</h2>
        <p className="text-muted-foreground mt-2">
          Real-time popularity boosts recorded today. Values reset daily (UTC).
        </p>
        <div className="mt-4 overflow-x-auto rounded-md border">
          <table className="min-w-[600px] w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Gear</th>
                <th className="px-3 py-2 text-left font-medium">Live Score</th>
                <th className="px-3 py-2 text-left font-medium">Views</th>
                <th className="px-3 py-2 text-left font-medium">Wishlist</th>
                <th className="px-3 py-2 text-left font-medium">Owners</th>
                <th className="px-3 py-2 text-left font-medium">Compare</th>
                <th className="px-3 py-2 text-left font-medium">Reviews</th>
              </tr>
            </thead>
            <tbody>
              {liveBoosts.length ? (
                liveBoosts.map((item, idx) => (
                  <tr key={item.gearId} className="border-b">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/gear/${item.slug}`}
                        className="hover:underline"
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-semibold">
                      {item.liveScore.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {item.stats.views}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {item.stats.wishlistAdds}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {item.stats.ownerAdds}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {item.stats.compareAdds}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {item.stats.reviewSubmits}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="text-muted-foreground px-3 py-6 text-center"
                  >
                    No live boosts recorded yet today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Thumbnail Background Export Tool */}
      <div>
        <h2 className="text-2xl font-bold">Thumbnail Background Export</h2>
        <p className="text-muted-foreground mt-2">
          Place a transparent image over the default thumbnail background and
          export to PNG.
        </p>
        <div className="mt-4">
          <GradientImageTool />
        </div>
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
        <h2 className="text-2xl font-bold">Shared List OG Preview</h2>
        <p className="text-muted-foreground mt-2">
          Paste a published shared-list URL and preview the generated OG image.
        </p>
        <div className="mt-4">
          <SharedListOgPreviewTool />
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
