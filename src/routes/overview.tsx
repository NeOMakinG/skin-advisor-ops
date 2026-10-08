import { useQuery } from "@tanstack/react-query";
import { DriftPanel } from "@/components/overview/drift-panel";
import { Funnel } from "@/components/overview/funnel";
import { KpiStrip } from "@/components/overview/kpi-strip";
import { VolumeChart } from "@/components/overview/volume-chart";
import { PageHeader } from "@/components/page-header";
import { QueryError } from "@/components/query-error";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartLegend } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useScope } from "@/lib/scope";
import { useTRPC } from "@/lib/trpc";

const volumeLegend = {
  started: { label: "Started", color: "var(--ramp-2)" },
  analyzed: { label: "Analyzed", color: "var(--ramp-3)" },
};

export function OverviewPage() {
  const trpc = useTRPC();
  const scope = useScope();
  const overview = useQuery(trpc.metrics.overview.queryOptions(scope));
  const drift = useQuery(trpc.metrics.drift.queryOptions({ partner: scope.partner }));
  const partners = useQuery(trpc.partners.list.queryOptions());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        description="Where advisor sessions end, how that converts, and whether the concern model still looks like last week."
      />

      {overview.isPending || drift.isPending || partners.isPending ? (
        <OverviewSkeleton />
      ) : overview.isError || drift.isError || partners.isError ? (
        <QueryError
          title="Could not load the overview"
          message={(overview.error ?? drift.error ?? partners.error)?.message ?? "Unknown error"}
          onRetry={() => {
            void overview.refetch();
            void drift.refetch();
            void partners.refetch();
          }}
        />
      ) : (
        <>
          <KpiStrip
            kpis={overview.data.kpis}
            previous={overview.data.previousKpis}
            rangeDays={scope.range}
          />

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="flex flex-col gap-4 lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Session funnel</CardTitle>
                  <CardDescription>
                    Every stage a session can reach, as a share of sessions started.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Funnel steps={overview.data.funnel} />
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                  <div className="grid gap-1.5">
                    <CardTitle>Daily volume</CardTitle>
                    <CardDescription>
                      Sessions started and sessions that produced an analysis.
                    </CardDescription>
                  </div>
                  <ChartLegend config={volumeLegend} />
                </CardHeader>
                <CardContent>
                  <VolumeChart data={overview.data.volume} />
                </CardContent>
              </Card>
            </div>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Diagnostic drift</CardTitle>
                <CardDescription>
                  Share of analyzed sessions flagged with each concern, week over week.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DriftPanel
                  outcome={drift.data.scoped}
                  perPartner={drift.data.perPartner}
                  rollouts={drift.data.rollouts}
                  partners={partners.data.partners}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-busy="true"
      aria-label="Loading overview"
    >
      <Skeleton className="h-24" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-[37rem] lg:col-span-2" />
      </div>
    </div>
  );
}
