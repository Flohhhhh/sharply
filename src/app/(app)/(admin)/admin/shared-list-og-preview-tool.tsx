"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Copy, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type ParsedOgResult =
  | { ok: true; ogUrl: string }
  | { ok: false; message: string };

function parseSharedListOgUrl(rawValue: string): ParsedOgResult {
  const value = rawValue.trim();
  if (!value) {
    return { ok: false, message: "Paste a published list URL first." };
  }

  let url: URL;
  try {
    const base =
      typeof window === "undefined" ? "http://localhost" : window.location.origin;
    url = new URL(value, base);
  } catch {
    return { ok: false, message: "That does not look like a valid URL or path." };
  }

  const normalizedPath = url.pathname.replace(/\/+$/, "");
  const pathWithoutOg = normalizedPath.endsWith("/opengraph-image")
    ? normalizedPath.slice(0, -"/opengraph-image".length)
    : normalizedPath;

  const match = pathWithoutOg.match(/^\/list\/([^/]+)$/);
  if (!match?.[1]) {
    return {
      ok: false,
      message: "Expected a shared list link like /list/my-list-a79bn3.",
    };
  }

  return {
    ok: true,
    ogUrl: `${url.origin}/list/${match[1]}/opengraph-image`,
  };
}

export function SharedListOgPreviewTool() {
  const [value, setValue] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const displayUrl = useMemo(() => {
    if (!previewUrl) return null;
    return `${previewUrl}${previewUrl.includes("?") ? "&" : "?"}v=${version}`;
  }, [previewUrl, version]);

  const handlePreview = () => {
    const parsed = parseSharedListOgUrl(value);
    if (!parsed.ok) {
      setPreviewUrl(null);
      setError(parsed.message);
      return;
    }
    setError(null);
    setPreviewUrl(parsed.ogUrl);
    setVersion((prev) => prev + 1);
  };

  const handleCopy = async () => {
    if (!previewUrl) return;
    try {
      await navigator.clipboard.writeText(previewUrl);
      toast.success("OG image URL copied");
    } catch {
      toast.error("Unable to copy OG image URL");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared List OG Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shared-list-url">Published list URL</Label>
          <Input
            id="shared-list-url"
            placeholder="https://sharply.app/list/my-list-a79bn3"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Paste a full URL or path like <code>/list/my-list-a79bn3</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={handlePreview} icon={<Search className="size-4" />}>
            Preview OG
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setValue("");
              setPreviewUrl(null);
              setError(null);
            }}
          >
            Clear
          </Button>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {previewUrl ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary inline-flex items-center gap-1 underline"
              >
                Open OG URL
                <ExternalLink className="size-3.5" />
              </a>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={<Copy className="size-4" />}
                onClick={() => void handleCopy()}
              >
                Copy
              </Button>
            </div>
            <div className="overflow-hidden rounded-md border">
              {displayUrl ? (
                <Image
                  src={displayUrl}
                  alt="Shared list OG preview"
                  width={1200}
                  height={630}
                  unoptimized
                  className="h-auto w-full"
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

