import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DayVolume } from "@/domain/metrics";
import { formatDay } from "@/lib/dates";
import { formatCompactCount, formatCount } from "@/lib/format";
import { niceTicks } from "@/lib/ticks";

const config = {
  started: { label: "Started", color: "var(--ramp-2)" },
  analyzed: { label: "Analyzed", color: "var(--ramp-3)" },
} satisfies ChartConfig;

export function VolumeChart({ data }: { data: DayVolume[] }) {
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.started)));
  return (
    <ChartContainer config={config} className="h-56 w-full aspect-auto">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-started" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-started)" stopOpacity={0.18} />
            <stop offset="95%" stopColor="var(--color-started)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
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
          domain={[0, ticks[ticks.length - 1] ?? 0]}
          ticks={ticks}
          tickFormatter={(v: number) => formatCompactCount(v)}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={
            <ChartTooltipContent
              labelFormatter={(d) => formatDay(d, "long")}
              formatter={(v) => formatCount(v)}
            />
          }
        />
        <Area
          dataKey="started"
          type="monotone"
          stroke="var(--color-started)"
          strokeWidth={2}
          fill="url(#fill-started)"
          isAnimationActive={false}
        />
        <Area
          dataKey="analyzed"
          type="monotone"
          stroke="var(--color-analyzed)"
          strokeWidth={2}
          fill="transparent"
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
