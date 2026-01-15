"use client";

import { useState, useEffect } from "react";
import { UploadButton } from "~/lib/utils/uploadthing";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Download, Trash2, FileDown } from "lucide-react";
import {
  actionFetchSamples,
  actionCreateSample,
  actionDeleteSample,
} from "~/server/gear-samples/actions";
import type { GearSampleFile } from "~/server/gear-samples/data";
import { toast } from "sonner";

interface GearSampleFilesProps {
  gearId: string;
  slug: string;
  canManage: boolean; // EDITOR+ permissions
}

export function GearSampleFiles({
  gearId,
  slug,
  canManage,
}: GearSampleFilesProps) {
  const [samples, setSamples] = useState<GearSampleFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSamples();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gearId]);

  const loadSamples = async () => {
    setLoading(true);
    try {
      const data = await actionFetchSamples(gearId);
      setSamples(data);
    } catch (error) {
      console.error("Failed to load samples:", error);
      toast.error("Failed to load sample files");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sample file?")) return;

    try {
      await actionDeleteSample(id, slug);
      toast.success("Sample deleted");
      await loadSamples();
    } catch (error) {
      console.error("Failed to delete sample:", error);
      toast.error("Failed to delete sample");
    }
  };

  const handleDownloadAll = () => {
    window.open(`/api/gear-samples/${gearId}/download-all`, "_blank");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sample Raw Files</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading samples...</p>
        </CardContent>
      </Card>
    );
  }

  // Don't show the component if there are no samples and user can't manage
  if (!canManage && samples.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sample Raw Files</span>
          {samples.length > 0 && (
            <Button onClick={handleDownloadAll} variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Download All (.zip)
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canManage && (
          <div className="space-y-2">
            <UploadButton
              endpoint="gearSampleUploader"
              input={{ gearId }}
              onClientUploadComplete={async (res) => {
                try {
                  for (const file of res) {
                    await actionCreateSample({
                      gearId,
                      slug,
                      fileName: file.name,
                      fileUrl: file.url,
                      fileKey: file.key,
                      fileSizeBytes: file.size,
                      fileExtension: file.name.split(".").pop() || "",
                    });
                  }
                  toast.success("Samples uploaded successfully");
                  await loadSamples();
                } catch (error) {
                  console.error("Failed to save samples:", error);
                  toast.error("Failed to save uploaded samples");
                }
              }}
              onUploadError={(error) => {
                console.error("Upload error:", error);
                toast.error(error.message);
              }}
            />
            <p className="text-muted-foreground text-xs">
              Upload raw camera files (.RAF, .CR3, .ARW, .NEF, .DNG, etc.). Max
              128MB per file, up to 10 files at once.
            </p>
          </div>
        )}

        {samples.length > 0 ? (
          <ul className="space-y-2">
            {samples.map((sample) => (
              <li
                key={sample.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex-1">
                  <div className="font-medium">{sample.fileName}</div>
                  <div className="text-muted-foreground text-xs">
                    {(sample.fileSizeBytes / 1024 / 1024).toFixed(2)} MB •{" "}
                    {sample.downloadCount} downloads
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `/api/gear-samples/${sample.id}/download`,
                        "_blank",
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(sample.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            No sample files available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
