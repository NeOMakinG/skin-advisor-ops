import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import type { Kpis } from "@/domain/metrics";
import { formatChange, formatCount, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Tile {
  key: keyof Kpis;
  label: string;
  value: string;
  hint: string;
  /** Relative change versus the previous window, when one exists. */
  change: number | null;
}

export function KpiStrip({
  kpis,
  previous,
  rangeDays,
}: {
  kpis: Kpis;
  previous: Kpis | null;
  rangeDays: number;
}) {
  const change = (key: keyof Kpis) =>
    previous && previous[key] !== 0 ? kpis[key] / previous[key] - 1 : null;
  const tiles: Tile[] = [
    {
      key: "sessions",
      label: "Sessions started",
      value: formatCount(kpis.sessions),
      hint: `Last ${rangeDays} days`,
      change: change("sessions"),
    },
    {
      key: "completionRate",
      label: "Completion rate",
      value: formatPercent(kpis.completionRate),
      hint: "Reached an analysis result",
      change: change("completionRate"),
    },
    {
      key: "clickRate",
      label: "Recommendation click rate",
      value: formatPercent(kpis.clickRate),
      hint: "Clicked a recommended product",
      change: change("clickRate"),
    },
    {
      key: "conversionUplift",
      label: "Conversion uplift",
      value: `${kpis.conversionUplift >= 0 ? "+" : ""}${formatPercent(kpis.conversionUplift, 0)}`,
      hint: "Purchase rate vs partner baseline",
      change: change("conversionUplift"),
    },
  ];

  return (
    <dl className="grid divide-y rounded-xl border bg-card shadow-xs sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
      {tiles.map((tile, i) => (
        <div
          key={tile.key}
          className={cn(
            "flex flex-col gap-1 px-5 py-4",
            i === 1 && "sm:border-l lg:border-l-0",
            i >= 2 && "sm:border-t lg:border-t-0",
            i === 3 && "sm:border-l lg:border-l-0",
          )}
        >
          <dt className="text-sm text-muted-foreground">{tile.label}</dt>
          <dd className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xl font-semibold tracking-tight">{tile.value}</span>
            {tile.change !== null ? <Delta change={tile.change} /> : null}
          </dd>
          <dd className="text-xs text-muted-foreground">
            {tile.change !== null ? `${tile.hint}, vs previous ${rangeDays} days` : tile.hint}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Delta({ change }: { change: number }) {
  const up = change > 0.001;
  const down = change < -0.001;
  const Icon = up ? ArrowUpRightIcon : down ? ArrowDownRightIcon : null;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center gap-0.5 text-xs font-medium",
        up ? "text-status-good" : down ? "text-status-critical" : "text-muted-foreground",
      )}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      {formatChange(change)}
    </span>
  );
}
