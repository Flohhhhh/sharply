"use client";

import { useEffect, useState, useTransition } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { actionUpdateSocialLinks } from "~/server/users/actions";
import { Globe, Instagram } from "lucide-react";
import type { SocialLink } from "~/server/users/service";

type SocialLinksFormProps = {
  defaultLinks: SocialLink[];
  onSuccess?: (links: SocialLink[]) => void;
};

type ParsedDefaults = {
  instagramSlug: string;
  portfolioUrl: string;
};

const buildInstagramUrl = (slug: string) => {
  const cleanedSlug = slug
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^\//, "")
    .replace(/\/.*/, "");
  return cleanedSlug ? `https://www.instagram.com/${cleanedSlug}/` : "";
};

const parseInstagramSlug = (url: string) => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("instagram.com")) return "";
    const [firstSegment] = parsed.pathname.replace(/^\//, "").split("/");
    return firstSegment || "";
  } catch {
    return "";
  }
};

const extractDefaults = (links: SocialLink[]): ParsedDefaults => {
  const instagram = links.find(
    (link) =>
      link.icon?.toLowerCase() === "instagram" ||
      link.label?.trim().toLowerCase() === "instagram",
  );
  const portfolio = links.find(
    (link) =>
      link.icon?.toLowerCase() === "website" ||
      link.label?.trim().toLowerCase() === "portfolio",
  );

  return {
    instagramSlug: instagram ? parseInstagramSlug(instagram.url) : "",
    portfolioUrl: portfolio?.url ?? "",
  };
};

export function SocialLinksForm({
  defaultLinks,
  onSuccess,
}: SocialLinksFormProps) {
  const [instagramSlug, setInstagramSlug] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const parsed = extractDefaults(defaultLinks);
    setInstagramSlug(parsed.instagramSlug);
    setPortfolioUrl(parsed.portfolioUrl);
  }, [defaultLinks]);

  const instagramUrlPreview = buildInstagramUrl(instagramSlug);
  const portfolioUrlPreview = portfolioUrl.trim();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        setError(null);
        setSuccess(false);

        const outgoing: SocialLink[] = [];

        if (instagramSlug.trim()) {
          outgoing.push({
            label: "Instagram",
            icon: "instagram",
            url: buildInstagramUrl(instagramSlug),
          });
        }

        if (portfolioUrl.trim()) {
          outgoing.push({
            label: "Portfolio",
            icon: "website",
            url: portfolioUrl.trim(),
          });
        }

        const res = await actionUpdateSocialLinks(outgoing);
        const parsed = extractDefaults(res.socialLinks);
        setInstagramSlug(parsed.instagramSlug);
        setPortfolioUrl(parsed.portfolioUrl);
        setSuccess(true);
        onSuccess?.(res.socialLinks);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="instagram">Instagram</Label>
          <div className="relative">
            <Instagram className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              id="instagram"
              value={instagramSlug}
              onChange={(e) => setInstagramSlug(e.target.value)}
              placeholder="username"
              className="pl-9"
              aria-label="Instagram username"
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Will save: {instagramUrlPreview || "Add a username to create link"}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="portfolio">Portfolio</Label>
          <div className="relative">
            <Globe className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              id="portfolio"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://your-portfolio.com"
              className="pl-9"
              aria-label="Portfolio URL"
              type="url"
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Will save: {portfolioUrlPreview || "Add a URL to create link"}
          </p>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {success ? (
        <p className="text-green-600 dark:text-green-400 text-sm">
          Social links updated successfully!
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} loading={isPending}>
        Save Changes
      </Button>
    </form>
  );
}
