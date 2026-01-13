"use client";

import { useState } from "react";
import { UploadButton, UploadDropzone } from "~/lib/utils/uploadthing";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Copy } from "lucide-react";

export function AdminImageUploader() {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <UploadDropzone
          endpoint="imageUploader"
          onClientUploadComplete={(res) => {
            const urls = res?.map((f) => f.ufsUrl).filter(Boolean) as string[];
            setUploadedUrls((prev) => [...prev, ...urls]);
          }}
          onUploadError={(error) => {
            console.error(error);
            alert(error.message);
          }}
        />

        {uploadedUrls.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Uploaded URLs</div>
            <ul className="space-y-2">
              {uploadedUrls.map((url, idx) => (
                <li key={`${url}-${idx}`} className="flex items-center gap-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary break-all underline"
                  >
                    {url}
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(url);
                      } catch {
                        // ignore
                      }
                    }}
                    aria-label="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-muted-foreground text-xs">
          Images are uploaded with your account. Max 1 file, 4MB per image.
        </div>
      </CardContent>
    </Card>
  );
}

