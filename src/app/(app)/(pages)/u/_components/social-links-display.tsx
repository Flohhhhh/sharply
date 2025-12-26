import Link from "next/link";
import { Instagram, Globe, ExternalLink } from "lucide-react";
import type { SocialLink } from "~/server/users/service";

type SocialLinksDisplayProps = {
  links: SocialLink[];
};

export function SocialLinksDisplay({ links }: SocialLinksDisplayProps) {
  if (!links || links.length === 0) {
    return null;
  }

  const getIconComponent = (icon?: string) => {
    switch (icon) {
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "website":
        return <Globe className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  const formatDisplayUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.replace(/\/$/, "");
      return `${parsed.hostname}${pathname}`;
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-1.5">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:text-foreground/80 flex items-center gap-2 text-sm"
        >
          {getIconComponent(link.icon)}
          <span className="font-medium">{link.label}</span>
          <span className="text-muted-foreground truncate text-xs sm:text-sm">
            {formatDisplayUrl(link.url)}
          </span>
          <ExternalLink className="text-muted-foreground h-3.5 w-3.5 flex-shrink-0" />
        </Link>
      ))}
    </div>
  );
}
