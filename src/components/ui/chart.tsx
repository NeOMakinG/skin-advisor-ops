import * as React from "react";
import { ResponsiveContainer, Tooltip, type TooltipContentProps } from "recharts";
import { cn } from "@/lib/utils";

// shadcn/ui-style chart wrapper for Recharts 3: a config maps series keys to labels and
// colors, and ChartContainer exposes them as --color-<key> CSS variables.
export type ChartConfig = Record<string, { label: string; color: string }>;

const ChartContext = React.createContext<ChartConfig | null>(null);

function useChart() {
  const config = React.useContext(ChartContext);
  if (!config) throw new Error("useChart must be used within a <ChartContainer />");
  return config;
}

function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof ResponsiveContainer>["children"];
}) {
  const vars = Object.fromEntries(
    Object.entries(config).map(([key, item]) => [`--color-${key}`, item.color]),
  ) as React.CSSProperties;
  return (
    <ChartContext.Provider value={config}>
      <div
        data-slot="chart"
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/60 [&_.recharts-surface]:outline-hidden [&_.recharts-tooltip-cursor]:stroke-border",
          className,
        )}
        style={vars}
        {...props}
      >
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = Tooltip;

type ChartTooltipContentProps = Partial<
  Pick<TooltipContentProps, "active" | "payload" | "label">
> & {
  formatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
};

function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: ChartTooltipContentProps) {
  const config = useChart();
  if (!active || !payload?.length) return null;
  const heading = label === undefined ? null : String(label);
  return (
    <div className="grid min-w-[9rem] gap-1.5 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {heading ? (
        <div className="font-medium">{labelFormatter ? labelFormatter(heading) : heading}</div>
      ) : null}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? "value");
          const entry = config[key];
          const value = typeof item.value === "number" ? item.value : Number(item.value ?? 0);
          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: entry?.color ?? item.color }}
                />
                {entry?.label ?? key}
              </div>
              <span className="tabular font-medium text-foreground">
                {formatter ? formatter(value) : value.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
