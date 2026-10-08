import { ActivityIcon, EyeIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDay } from "@/lib/dates";
import { formatMs } from "@/lib/format";
import type { Partner } from "@/schemas/partner";
import { type Incident, stepLabel } from "@/schemas/session";

export function IncidentList({
  incidents,
  partners,
}: {
  incidents: Incident[];
  partners: Partner[];
}) {
  if (incidents.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        No incidents in this range for this partner.
      </p>
    );
  }
  return (
    <ol className="divide-y rounded-lg border bg-card" aria-label="Incidents">
      {incidents.map((incident) => {
        const partner = partners.find((p) => p.id === incident.partnerId);
        return (
          <li
            key={incident.id}
            className="grid gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[8rem_1fr_auto]"
          >
            <div className="text-sm">
              <div className="font-medium">{formatDay(incident.date, "long")}</div>
              <div className="text-xs text-muted-foreground">{incident.id}</div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{incident.title}</span>
                <Badge variant="secondary">{stepLabel[incident.step]}</Badge>
                <Badge variant="outline">{partner ? partner.name : "All partners"}</Badge>
              </div>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">{incident.summary}</p>
            </div>
            <div className="flex flex-row items-center gap-3 text-xs text-muted-foreground sm:flex-col sm:items-end sm:gap-1">
              <span className="tabular">
                p99 peak{" "}
                <span className="font-medium text-foreground">{formatMs(incident.peakP99Ms)}</span>
              </span>
              {incident.durationMin > 0 ? (
                <span className="tabular">{incident.durationMin} min</span>
              ) : null}
              {incident.status === "resolved" ? (
                <span className="flex items-center gap-1 text-status-good">
                  <ActivityIcon className="size-3.5" aria-hidden="true" />
                  Resolved
                </span>
              ) : (
                <span className="flex items-center gap-1 text-status-warning">
                  <EyeIcon className="size-3.5" aria-hidden="true" />
                  Monitoring
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
