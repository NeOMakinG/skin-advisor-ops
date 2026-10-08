import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { OutcomeBadge } from "@/components/sessions/outcome-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/dates";
import { formatCount, formatDuration, formatMs } from "@/lib/format";
import type { Partner } from "@/schemas/partner";
import { type Country, countryName } from "@/schemas/partner";
import { failureLabel, type Session } from "@/schemas/session";

export type SessionRow = Session & { country: Country };

export function SessionsTable({
  rows,
  total,
  page,
  pageCount,
  pageSize,
  partners,
  onPage,
  onOpen,
}: {
  rows: SessionRow[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  partners: Partner[];
  onPage: (page: number) => void;
  onOpen: (session: SessionRow) => void;
}) {
  const partnerName = (id: string) => partners.find((p) => p.id === id)?.name ?? id;
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Session</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Browser</TableHead>
              <TableHead>Skin tone</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead className="text-right">Analysis</TableHead>
              <TableHead>Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No sessions match these filters. Widen the range or clear a filter.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => onOpen(s)}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpen(s);
                      }}
                      className="rounded-sm text-left font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
                      aria-label={`Open session ${s.id}`}
                    >
                      <span className="font-mono text-xs">{s.id}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatDateTime(s.startedAt)}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div>{partnerName(s.partnerId)}</div>
                    <div className="text-xs text-muted-foreground">{countryName[s.country]}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{s.device}</TableCell>
                  <TableCell className="whitespace-nowrap">{s.browser}</TableCell>
                  <TableCell>Tone {s.skinTone}</TableCell>
                  <TableCell className="tabular text-right">
                    {formatDuration(s.durationMs)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {s.analysisMs === null ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      formatMs(s.analysisMs)
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <OutcomeBadge outcome={s.outcome} />
                    {s.failureReason ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {failureLabel[s.failureReason]}
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Showing {formatCount(first)} to {formatCount(last)} of {formatCount(total)} sessions
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            <ChevronLeftIcon />
            Previous
          </Button>
          <span className="tabular text-xs text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => onPage(page + 1)}
          >
            Next
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
