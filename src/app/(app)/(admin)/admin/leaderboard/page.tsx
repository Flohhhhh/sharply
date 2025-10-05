import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { fetchContributorLeaderboard } from "~/server/leaderboard/service";

export default async function AdminLeaderboardPage() {
  const rows = await fetchContributorLeaderboard(15);

  const getInitials = (name: string | null) => {
    const initials = (name || "U")
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0]!)
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return initials;
  };

  return (
    <div className="px-8">
      <Card>
        <CardHeader>
          <CardTitle>Top Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No contributions yet.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {rows.map((u, i) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-6 text-right text-sm tabular-nums">
                      {i + 1}.
                    </span>
                    <Avatar className="size-8">
                      <AvatarImage
                        src={u.image ?? undefined}
                        alt={u.name ?? "User"}
                      />
                      <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm">{u.name || u.id}</span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-4 text-sm">
                    <span className="tabular-nums">{u.score}</span>
                    <span className="tabular-nums">edits {u.edits}</span>
                    <span className="tabular-nums">creates {u.creations}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
