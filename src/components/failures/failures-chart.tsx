import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { failureConfig } from "@/components/failures/failure-colors";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { FailureDay } from "@/domain/metrics";
import { formatDay } from "@/lib/dates";
import { formatCompactCount, formatCount } from "@/lib/format";
import { FailureReason } from "@/schemas/session";

function niceTicks(data: FailureDay[]) {
  const max = Math.max(
    0,
    ...data.map((d) => FailureReason.options.reduce((sum, r) => sum + d[r], 0)),
  );
  const step = max > 4000 ? 1000 : max > 1500 ? 500 : max > 600 ? 200 : 100;
  const top = Math.ceil(max / step) * step || step;
  return Array.from({ length: top / step + 1 }, (_, i) => i * step);
}

export function FailuresChart({ data }: { data: FailureDay[] }) {
  const ticks = niceTicks(data);
  return (
    <ChartContainer config={failureConfig} className="h-64 w-full aspect-auto">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={3}>
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
          cursor={{ fill: "var(--secondary)" }}
          content={
            <ChartTooltipContent
              labelFormatter={(d) => formatDay(d, "long")}
              formatter={(v) => formatCount(v)}
            />
          }
        />
        {FailureReason.options.map((reason, i) => (
          <Bar
            key={reason}
            dataKey={reason}
            stackId="failures"
            fill={`var(--color-${reason})`}
            stroke="var(--card)"
            strokeWidth={1}
            maxBarSize={22}
            radius={i === FailureReason.options.length - 1 ? [3, 3, 0, 0] : 0}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
