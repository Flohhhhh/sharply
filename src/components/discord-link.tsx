import Link from "next/link";
import { FaDiscord } from "react-icons/fa";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";

export default function DiscordLink(props: {
  className?: string;
  label?: string;
}) {
  const { className, label = "Join Discord" } = props;
  return (
    <Button
      asChild
      icon={<FaDiscord className="h-4 w-4" />}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded bg-[#5865F2] px-6 py-2 text-white transition-all hover:bg-[#5865F2]/80",
        className,
      )}
    >
      <Link href="/discord/invite" target="_blank" rel="noopener noreferrer">
        {label}
      </Link>
    </Button>
  );
}
