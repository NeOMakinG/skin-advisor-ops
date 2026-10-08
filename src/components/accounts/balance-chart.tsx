import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCompact, formatMoney } from "@/lib/utils";
import type { BalancePoint } from "@/schemas/account";

const config = {
  balance: { label: "Balance", color: "var(--chart-1)" },
} satisfies ChartConfig;

function monthLabel(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}

function fullMonthLabel(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function BalanceChart({ data, currency }: { data: BalancePoint[]; currency: string }) {
  return (
    <ChartContainer config={config} className="h-56 w-full aspect-auto">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-balance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          minTickGap={24}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={monthLabel}
        />
        <YAxis
          width={56}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          tickFormatter={(value: number) => formatCompact(value, currency)}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={
            <ChartTooltipContent
              labelFormatter={fullMonthLabel}
              formatter={(value) => formatMoney(value, currency)}
            />
          }
        />
        <Area
          dataKey="balance"
          type="monotone"
          stroke="var(--color-balance)"
          strokeWidth={2}
          fill="url(#fill-balance)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
