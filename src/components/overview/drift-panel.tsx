import { CheckCircle2Icon, CircleDashedIcon, TriangleAlertIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { DRIFT_THRESHOLD_PP, type DriftReport } from "@/domain/drift";
import { formatDay } from "@/lib/dates";
import { formatCount, formatPercent, formatPp } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Partner } from "@/schemas/partner";
import { type Concern, concernLabel, type Incident } from "@/schemas/session";
import type { DriftOutcome } from "@/server/routers/metrics";

const config = {
  previous: { label: "Previous 7 days", color: "var(--ramp-neutral)" },
  current: { label: "Last 7 days", color: "var(--ramp-3)" },
} satisfies ChartConfig;

export function DriftPanel({
  outcome,
  perPartner,
  rollouts,
  partners,
}: {
  outcome: DriftOutcome;
  perPartner: { partnerId: string; outcome: DriftOutcome }[];
  rollouts: Incident[];
  partners: Partner[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <DriftStatus outcome={outcome} />
      {outcome.kind === "report" ? <DriftChart report={outcome.report} /> : null}
      {rollouts.length > 0 ? (
        <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
          {rollouts.map((r) => (
            <li key={r.id}>
              {formatDay(r.date)}: {r.title}
              {r.partnerId ? ` (${partners.find((p) => p.id === r.partnerId)?.name ?? ""})` : ""}.
              Shares after this date are compared against the week before it.
            </li>
          ))}
        </ul>
      ) : null}
      {perPartner.length > 0 ? (
        <ul className="divide-y rounded-lg border text-sm" aria-label="Drift per partner">
          {perPartner.map(({ partnerId, outcome: o }) => {
            const partner = partners.find((p) => p.id === partnerId);
            return (
              <li key={partnerId} className="flex items-center justify-between gap-3 px-3 py-2">
                <span>{partner?.name ?? partnerId}</span>
                <PartnerVerdict outcome={o} />
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function DriftStatus({ outcome }: { outcome: DriftOutcome }) {
  if (outcome.kind === "unavailable") {
    return (
      <Callout
        tone="muted"
        icon={<CircleDashedIcon className="size-4" aria-hidden="true" />}
        title="Not enough history to compare"
      >
        {outcome.message}
      </Callout>
    );
  }
  const { report } = outcome;
  const top = report.flagged[0];
  const weeks = `${formatDay(report.current.from)} to ${formatDay(report.current.to)} against ${formatDay(report.previous.from)} to ${formatDay(report.previous.to)}, ${formatCount(report.current.analyzed)} and ${formatCount(report.previous.analyzed)} analyzed sessions.`;
  if (!top) {
    return (
      <Callout
        tone="good"
        icon={<CheckCircle2Icon className="size-4" aria-hidden="true" />}
        title={`No concern moved more than ${DRIFT_THRESHOLD_PP} pp week over week`}
      >
        {weeks}
      </Callout>
    );
  }
  return (
    <Callout
      tone="warning"
      icon={<TriangleAlertIcon className="size-4" aria-hidden="true" />}
      title={`${concernLabel[top.concern]} ${formatPp(top.deltaPp)} week over week`}
    >
      {report.flagged.length > 1
        ? `${report.flagged
            .slice(1)
            .map((s) => `${concernLabel[s.concern]} ${formatPp(s.deltaPp)}`)
            .join(", ")} also moved. `
        : ""}
      {weeks}
    </Callout>
  );
}

function PartnerVerdict({ outcome }: { outcome: DriftOutcome }) {
  if (outcome.kind === "unavailable") {
    return <span className="text-muted-foreground">Not enough history</span>;
  }
  const top = outcome.report.flagged[0];
  if (!top) {
    return (
      <span className="flex items-center gap-1 text-status-good">
        <CheckCircle2Icon className="size-3.5" aria-hidden="true" />
        Stable
      </span>
    );
  }
  return (
    <span className="tabular flex items-center gap-1 font-medium text-status-warning">
      <TriangleAlertIcon className="size-3.5" aria-hidden="true" />
      {concernLabel[top.concern]} {formatPp(top.deltaPp)}
    </span>
  );
}

function Callout({
  tone,
  icon,
  title,
  children,
}: {
  tone: "good" | "warning" | "muted";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex gap-2.5 rounded-lg px-3 py-2.5",
        tone === "good" && "bg-status-good-soft text-status-good",
        tone === "warning" && "bg-status-warning-soft text-status-warning",
        tone === "muted" && "bg-secondary text-muted-foreground",
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-foreground/70">{children}</p>
      </div>
    </div>
  );
}

function DriftChart({ report }: { report: DriftReport }) {
  const data = report.shifts.map((s) => ({
    concern: s.concern,
    previous: s.previousShare * 100,
    current: s.currentShare * 100,
    flagged: s.flagged,
  }));
  const max = Math.max(...data.flatMap((d) => [d.previous, d.current]));
  const top = Math.ceil((max + 2) / 10) * 10;
  const ticks = Array.from({ length: top / 10 + 1 }, (_, i) => i * 10);
  return (
    <div className="flex flex-col gap-2">
      <ChartLegend config={config} />
      <ChartContainer config={config} className="h-64 w-full aspect-auto">
        <BarChart
          data={data}
          layout="vertical"
          barGap={2}
          barCategoryGap={8}
          margin={{ top: 0, right: 36, left: 0, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
            domain={[0, top]}
            ticks={ticks}
          />
          <YAxis
            type="category"
            dataKey="concern"
            width={84}
            tickLine={false}
            interval={0}
            axisLine={false}
            tickFormatter={(c: Concern) => concernLabel[c]}
          />
          <ChartTooltip
            cursor={{ fill: "var(--secondary)" }}
            content={
              <ChartTooltipContent
                labelFormatter={(c) => concernLabel[c as Concern]}
                formatter={(v) => formatPercent(v / 100)}
              />
            }
          />
          <Bar
            dataKey="previous"
            fill="var(--color-previous)"
            radius={[0, 3, 3, 0]}
            maxBarSize={10}
            isAnimationActive={false}
          />
          <Bar
            dataKey="current"
            fill="var(--color-current)"
            radius={[0, 3, 3, 0]}
            maxBarSize={10}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
