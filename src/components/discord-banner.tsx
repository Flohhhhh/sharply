import DiscordLink from "./discord-link";
import { cn } from "~/lib/utils";

export default function DiscordBanner(props: {
  vertical?: boolean;
  label?: string;
  className?: string;
}) {
  const { vertical = false, label = "Chat on Discord", className } = props;
  return (
    <div
      className={cn(
        "border-border flex items-center justify-between gap-4 rounded-md border p-4",
        vertical ? "flex-col" : "flex-col sm:flex-row",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold">{label}</h3>
        <p className="text-muted-foreground max-w-lg text-sm">
          Join other Sharply members in the Photography Lounge Discord Server to
          chat with other users and get help with your gear.
        </p>
      </div>
      <DiscordLink className={cn(vertical ? "w-full" : "w-full sm:w-fit")} />
    </div>
  );
}
