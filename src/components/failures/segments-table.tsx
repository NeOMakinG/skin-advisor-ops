import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  type SortingState,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { failureConfig } from "@/components/failures/failure-colors";
import { SortableHead } from "@/components/sortable-header";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import type { FailureSegment } from "@/domain/metrics";
import { formatCount, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { countryName } from "@/schemas/partner";
import { failureLabel } from "@/schemas/session";

// v9: register only the features this table uses. Keep features and columns at module scope.
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
});

const helper = createColumnHelper<typeof features, FailureSegment>();
const numericColumns = new Set(["started", "failed", "failRate"]);

const columns = helper.columns([
  helper.accessor("device", { header: "Device", sortFn: "alphanumeric" }),
  helper.accessor("browser", { header: "Browser", sortFn: "alphanumeric" }),
  helper.accessor("country", {
    header: "Country",
    sortFn: "alphanumeric",
    cell: ({ getValue }) => countryName[getValue()],
  }),
  helper.accessor("started", {
    header: "Sessions",
    sortFn: "basic",
    cell: ({ getValue }) => <span className="tabular">{formatCount(getValue())}</span>,
  }),
  helper.accessor("failed", {
    header: "Failed",
    sortFn: "basic",
    cell: ({ getValue }) => <span className="tabular">{formatCount(getValue())}</span>,
  }),
  helper.accessor("failRate", {
    header: "Failure rate",
    sortFn: "basic",
    cell: ({ getValue, row }) => (
      <span
        className={cn(
          "tabular font-medium",
          row.original.failRate >= 0.24 && "text-status-critical",
        )}
      >
        {formatPercent(getValue())}
      </span>
    ),
  }),
  helper.accessor("topReason", {
    header: "Top reason",
    sortFn: "alphanumeric",
    cell: ({ getValue, row }) => (
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <span
          className="size-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: failureConfig[getValue()].color }}
          aria-hidden="true"
        />
        {failureLabel[getValue()]}
        <span className="tabular text-xs text-muted-foreground">
          {formatPercent(row.original.topReasonShare, 0)}
        </span>
      </span>
    ),
  }),
]);

export function SegmentsTable({ segments }: { segments: FailureSegment[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "failRate", desc: true }]);
  const table = useTable({
    features,
    columns,
    data: segments,
    getRowId: (row) => row.key,
    state: { sorting },
    onSortingChange: setSorting,
  });
  const rows = table.getRowModel().rows;

  return (
    <div className="max-h-[26rem] overflow-auto rounded-lg border bg-card">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => (
                <SortableHead
                  key={header.id}
                  sorted={header.column.getIsSorted()}
                  canSort={header.column.getCanSort()}
                  alignRight={numericColumns.has(header.column.id)}
                  onToggle={header.column.getToggleSortingHandler()}
                >
                  <table.FlexRender header={header} />
                </SortableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No sessions in this scope.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "whitespace-nowrap",
                      numericColumns.has(cell.column.id) && "text-right",
                    )}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
