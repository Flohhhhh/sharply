import DiscordLink from "./discord-link";
import { cn } from "~/lib/utils";

export default function DiscordBanner(props: { vertical?: boolean }) {
  const { vertical = false } = props;
  return (
    <div
      className={cn(
        "border-border flex items-center justify-between gap-4 rounded-md border p-4",
        vertical ? "flex-col" : "flex-col sm:flex-row",
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold">Chat on Discord</h3>
        <p className="text-muted-foreground max-w-lg text-sm">
          Join other Sharply members in the Photography Lounge Discord Server to
          chat with other users and get help with your gear.
        </p>
      </div>
      <DiscordLink className={cn(vertical ? "w-full" : "w-full sm:w-fit")} />
    </div>
  );
}
