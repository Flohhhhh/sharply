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

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:bg-secondary/80 border-border inline-flex items-center gap-2 rounded-lg border bg-secondary px-3 py-2 text-sm font-medium transition-colors"
        >
          {getIconComponent(link.icon)}
          <span>{link.label}</span>
        </Link>
      ))}
    </div>
  );
}
