import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { QueryError } from "@/components/query-error";
import { emptyFilters, SessionFiltersBar } from "@/components/sessions/session-filters";
import { SessionSheet } from "@/components/sessions/session-sheet";
import { SessionsTable } from "@/components/sessions/sessions-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionId } from "@/lib/ids";
import { useScope } from "@/lib/scope";
import { useTRPC } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import type { SessionFilters } from "@/server/routers/sessions";

const PAGE_SIZE = 12;

export function SessionsPage() {
  const trpc = useTRPC();
  const scope = useScope();
  const [filters, setFilters] = useState<SessionFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<SessionId | null>(null);

  const partners = useQuery(trpc.partners.list.queryOptions());
  const list = useQuery(
    trpc.sessions.list.queryOptions(
      { ...scope, filters, page, pageSize: PAGE_SIZE },
      { placeholderData: keepPreviousData },
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sessions"
        description="A sample of individual sessions in this scope. Open one to see what the model returned and which products were served."
      />
      <SessionFiltersBar
        filters={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      {list.isPending || partners.isPending ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Loading sessions"
          className="flex flex-col gap-3"
        >
          <Skeleton className="h-[34rem]" />
        </div>
      ) : list.isError || partners.isError ? (
        <QueryError
          title="Could not load sessions"
          message={(list.error ?? partners.error)?.message ?? "Unknown error"}
          onRetry={() => {
            void list.refetch();
            void partners.refetch();
          }}
        />
      ) : (
        <div className={cn("transition-opacity", list.isPlaceholderData && "opacity-60")}>
          <SessionsTable
            rows={list.data.rows}
            total={list.data.total}
            page={list.data.page}
            pageCount={list.data.pageCount}
            pageSize={PAGE_SIZE}
            partners={partners.data.partners}
            onPage={setPage}
            onOpen={(s) => setOpenId(s.id)}
          />
        </div>
      )}

      <SessionSheet sessionId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
