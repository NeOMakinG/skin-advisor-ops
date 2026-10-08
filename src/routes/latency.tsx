import { useQuery } from "@tanstack/react-query";
import { IncidentList } from "@/components/latency/incident-list";
import { LatencyChart, latencyConfig } from "@/components/latency/latency-chart";
import { PageHeader } from "@/components/page-header";
import { QueryError } from "@/components/query-error";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartLegend } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMs } from "@/lib/format";
import { useScope } from "@/lib/scope";
import { useTRPC } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { stepLabel } from "@/schemas/session";

const stepHint = {
  upload: "Selfie leaves the device and lands in storage.",
  analysis: "Vision model returns concern scores and a confidence.",
  recommend: "Catalog ranking returns the products to show.",
} as const;

export function LatencyPage() {
  const trpc = useTRPC();
  const scope = useScope();
  const latency = useQuery(trpc.metrics.latency.queryOptions(scope));
  const budget = useQuery(trpc.metrics.budget.queryOptions({}));
  const partners = useQuery(trpc.partners.list.queryOptions());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Latency and health"
        description="Daily p50, p95 and p99 for each step of the pipeline, against the p95 budget the partner team holds it to. Red dots mark incidents."
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <ChartLegend config={latencyConfig} className="text-sm" />
          <span className="flex items-center gap-1.5">
            <span
              className="w-4 border-t-2 border-dashed border-status-warning"
              aria-hidden="true"
            />
            p95 budget
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-status-critical" aria-hidden="true" />
            Incident
          </span>
        </div>
      </PageHeader>

      {latency.isPending || budget.isPending || partners.isPending ? (
        <LatencySkeleton />
      ) : latency.isError || budget.isError || partners.isError ? (
        <QueryError
          title="Could not load latency"
          message={(latency.error ?? budget.error ?? partners.error)?.message ?? "Unknown error"}
          onRetry={() => {
            void latency.refetch();
            void budget.refetch();
            void partners.refetch();
          }}
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {latency.data.steps.map(({ step, series }) => {
              const budgetP95 = budget.data[step].p95;
              const recent = series.slice(-7);
              const p95 = median(recent.map((d) => d.p95));
              const p50 = median(recent.map((d) => d.p50));
              const over = p95 > budgetP95;
              return (
                <Card key={step} className="gap-4">
                  <CardHeader>
                    <CardTitle>{stepLabel[step]}</CardTitle>
                    <CardDescription>{stepHint[step]}</CardDescription>
                    <dl className="mt-2 flex flex-col gap-1 text-sm">
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-muted-foreground">p50</dt>
                        <dd className="font-semibold">{formatMs(p50)}</dd>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-muted-foreground">p95</dt>
                        <dd className={cn("font-semibold", over && "text-status-critical")}>
                          {formatMs(p95)}
                        </dd>
                        <dd className="text-xs text-muted-foreground">
                          {over ? "over" : "within"} the {formatMs(budgetP95)} budget
                        </dd>
                      </div>
                    </dl>
                  </CardHeader>
                  <CardContent>
                    <LatencyChart
                      data={series}
                      budgetP95={budgetP95}
                      incidents={latency.data.incidents.filter((i) => i.step === step)}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Incidents</CardTitle>
              <CardDescription>
                Spikes the on-call engineer wrote up, plus model rollouts that change what the
                advisor returns. Medians in the cards above cover the last seven days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IncidentList incidents={latency.data.incidents} partners={partners.data.partners} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function LatencySkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-busy="true"
      aria-label="Loading latency"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
