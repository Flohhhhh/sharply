import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { listInvites } from "~/server/invites/service";
import { actionCreateInvite } from "~/server/invites/actions";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { CopyButton } from "./copy-button";

export const dynamic = "force-dynamic";

export default async function PrivateAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/admin/private");
  if (session.user.role !== "ADMIN") {
    return <div>Access denied.</div>;
  }

  const invites = await listInvites();

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Invite</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionCreateInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteeName">Name</Label>
              <Input
                id="inviteeName"
                name="inviteeName"
                placeholder="Ada Lovelace"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select name="role" defaultValue="USER">
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="EDITOR">EDITOR</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Create Link</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invites.map((inv) => {
              const link = `/invite/${inv.id}`;
              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{inv.inviteeName}</div>
                    <div className="text-muted-foreground text-sm">
                      Role: {inv.role}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Created: {inv.createdAt?.toISOString?.() ?? ""}
                    </div>
                    {inv.isUsed ? (
                      <div className="text-xs text-green-600">
                        Used{" "}
                        {inv.usedAt
                          ? new Date(inv.usedAt).toLocaleString()
                          : ""}
                      </div>
                    ) : (
                      <div className="text-xs">Not used</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={link} className="text-sm underline">
                      {link}
                    </Link>
                    <CopyButton
                      // remove last / from base url if needed
                      text={`${process.env.NEXT_PUBLIC_BASE_URL}/${link}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
