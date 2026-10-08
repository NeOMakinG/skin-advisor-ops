import { useQuery } from "@tanstack/react-query";
import { FailureShares } from "@/components/failures/failure-shares";
import { FailuresChart } from "@/components/failures/failures-chart";
import { SegmentsTable } from "@/components/failures/segments-table";
import { StallingProducts } from "@/components/failures/stalling-products";
import { PageHeader } from "@/components/page-header";
import { QueryError } from "@/components/query-error";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount, formatPercent } from "@/lib/format";
import { useScope } from "@/lib/scope";
import { useTRPC } from "@/lib/trpc";

export function FailuresPage() {
  const trpc = useTRPC();
  const scope = useScope();
  const query = useQuery(trpc.metrics.failures.queryOptions(scope));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Failures"
        description="Sessions that never reached an analysis result, by reason, by day, and by the device and browser they ran on."
      >
        {query.data ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{formatCount(query.data.failed)}</span>{" "}
            sessions failed,{" "}
            <span className="font-medium text-foreground">
              {formatPercent(query.data.failRate)}
            </span>{" "}
            of started
          </p>
        ) : null}
      </PageHeader>

      {query.isPending ? (
        <FailuresSkeleton />
      ) : query.isError ? (
        <QueryError
          title="Could not load failures"
          message={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Failures by day</CardTitle>
              <CardDescription>
                Stacked by reason. A rising timeout band usually lines up with a latency incident.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1fr_17rem]">
              <FailuresChart data={query.data.byDay} />
              <FailureShares shares={query.data.shares} />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Where sessions fail</CardTitle>
                <CardDescription>
                  Failure rate per device, browser and country. Sorted worst first.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SegmentsTable segments={query.data.segments} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recommendations that stall</CardTitle>
                <CardDescription>
                  Products served most often with the lowest click rate over the last 28 days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StallingProducts
                  rows={query.data.stalling}
                  showPartner={scope.partner === "all"}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function FailuresSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-busy="true"
      aria-label="Loading failures"
    >
      <Skeleton className="h-80" />
      <Skeleton className="h-96" />
      <Skeleton className="h-72" />
    </div>
  );
}
