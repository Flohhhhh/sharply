import { Suspense } from "react";
import { AuditLogList } from "../admin-audit-log-list";
import { BadgesAwardsList } from "../badges-awards-list";
import { RollupRunsList } from "../rollup-runs-list";

export default function LogsPage() {
  return (
    <div className="space-y-8 px-8">
      <div>
        <h1 className="text-3xl font-bold">Logs</h1>
        <p className="text-muted-foreground mt-2">
          Audit logs, badge awards, and popularity rollup runs.
        </p>
      </div>

      {/* Audit Logs */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">Audit Logs</h2>
          <p className="text-muted-foreground mt-2">
            Recent admin actions with links to affected items.
          </p>
        </div>
        <Suspense fallback={<div>Loading audit logs...</div>}>
          <AuditLogList />
        </Suspense>
      </div>

      {/* Recent Badge Awards */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">Recent Badge Awards</h2>
          <p className="text-muted-foreground mt-2">
            Latest awarded badges across the platform.
          </p>
        </div>
        <Suspense fallback={<div>Loading awards...</div>}>
          <BadgesAwardsList />
        </Suspense>
      </div>

      {/* Rollup Runs */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">Popularity Rollup Runs</h2>
          <p className="text-muted-foreground mt-2">
            Recent rollup history and metrics.
          </p>
        </div>
        <Suspense fallback={<div>Loading rollup runs...</div>}>
          <RollupRunsList />
        </Suspense>
      </div>
    </div>
  );
}
