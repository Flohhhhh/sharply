"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";

type AuditRow = {
  id: string;
  createdAt: string;
  action: string;
  actorId: string | null;
  actorName: string | null;
  gearId: string | null;
  gearName: string | null;
  gearSlug: string | null;
  gearEditId: string | null;
  editStatus: string | null;
};

export function AuditLogList() {
  const [items, setItems] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/audit?limit=25");
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="py-8 text-center">Loading logs...</div>;

  if (!items.length)
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No audit entries yet.</p>
        </CardContent>
      </Card>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground text-left text-xs">
            <th className="py-2 pr-4">Time</th>
            <th className="py-2 pr-4">Action</th>
            <th className="py-2 pr-4">Actor</th>
            <th className="py-2 pr-4">Target</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-border border-t">
              <td className="py-2 pr-4">
                {new Date(r.createdAt).toLocaleString()}
              </td>
              <td className="py-2 pr-4">{r.action}</td>
              <td className="py-2 pr-4">{r.actorName || r.actorId}</td>
              <td className="py-2 pr-4">
                {r.gearSlug ? (
                  <Link href={`/gear/${r.gearSlug}`} className="underline">
                    {r.gearName || r.gearSlug}
                  </Link>
                ) : r.gearEditId ? (
                  <Link
                    href={`/admin?highlight=${r.gearEditId}`}
                    className="underline"
                  >
                    Proposal {r.gearEditId.slice(0, 6)}
                  </Link>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
