import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { LatencyDay } from "@/domain/metrics";
import { formatDay } from "@/lib/dates";
import { formatMs } from "@/lib/format";
import type { Incident } from "@/schemas/session";

// p50, p95 and p99 are ordered, so they take the ordinal ramp: light to dark.
export const latencyConfig = {
  p50: { label: "p50", color: "var(--ramp-1)" },
  p95: { label: "p95", color: "var(--ramp-2)" },
  p99: { label: "p99", color: "var(--ramp-3)" },
} satisfies ChartConfig;

export function LatencyChart({
  data,
  budgetP95,
  incidents,
}: {
  data: LatencyDay[];
  budgetP95: number;
  incidents: Incident[];
}) {
  const max = Math.max(budgetP95, ...data.map((d) => d.p99));
  const step = max > 6000 ? 2000 : max > 2500 ? 1000 : 500;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  return (
    <ChartContainer config={latencyConfig} className="h-52 w-full aspect-auto">
      <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          minTickGap={28}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(d: string) => formatDay(d)}
        />
        <YAxis
          width={44}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          domain={[0, top]}
          ticks={ticks}
          tickFormatter={(v: number) => formatMs(v)}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={
            <ChartTooltipContent
              labelFormatter={(d) => formatDay(d, "long")}
              formatter={(v) => formatMs(v)}
            />
          }
        />
        <ReferenceLine y={budgetP95} stroke="var(--status-warning)" strokeDasharray="4 4" />
        {(["p50", "p95", "p99"] as const).map((key) => (
          <Line
            key={key}
            dataKey={key}
            type="monotone"
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            isAnimationActive={false}
          />
        ))}
        {incidents.map((incident) => {
          const point = data.find((d) => d.date === incident.date);
          // Rollouts (no duration) change what the model returns, not how fast; no dot.
          if (!point || incident.durationMin === 0) return null;
          return (
            <ReferenceDot
              key={incident.id}
              x={incident.date}
              y={point.p99}
              r={6}
              fill="var(--status-critical)"
              stroke="var(--card)"
              strokeWidth={2}
              aria-label={`Incident on ${formatDay(incident.date)}: ${incident.title}`}
            />
          );
        })}
      </LineChart>
    </ChartContainer>
  );
}
