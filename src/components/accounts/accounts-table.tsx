import { Link } from "@tanstack/react-router";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowSortingFeature,
  type SortingState,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/accounts/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatMoney } from "@/lib/utils";
import type { Account } from "@/schemas/account";

// v9: register only the features this table uses. Keep features and columns at module scope.
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
});

const helper = createColumnHelper<typeof features, Account>();
const numericColumns = new Set(["balance"]);

const columns = helper.columns([
  helper.accessor("name", {
    header: "Account",
    sortFn: "alphanumeric",
    cell: ({ row, getValue }) => (
      <Link
        to="/accounts/$accountId"
        params={{ accountId: row.original.id }}
        className="font-medium underline-offset-4 outline-none hover:underline focus-visible:underline"
      >
        {getValue()}
      </Link>
    ),
  }),
  helper.accessor("type", {
    header: "Type",
    sortFn: "alphanumeric",
    cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
  }),
  helper.accessor("status", {
    header: "Status",
    sortFn: "alphanumeric",
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),
  helper.accessor("currency", { header: "Currency", enableSorting: false }),
  helper.accessor("balance", {
    header: "Balance",
    sortFn: "basic",
    enableGlobalFilter: false,
    cell: ({ row, getValue }) => (
      <span className="tabular">{formatMoney(getValue(), row.original.currency)}</span>
    ),
  }),
]);

export function AccountsTable({ accounts }: { accounts: Account[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useTable({
    features,
    columns,
    data: accounts,
    getRowId: (row) => row.id,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-xs">
        <Label htmlFor="accounts-filter" className="sr-only">
          Filter accounts
        </Label>
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="accounts-filter"
          placeholder="Filter by name, type or status"
          className="pl-8"
          value={globalFilter}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
        />
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const alignRight = numericColumns.has(header.column.id);
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(alignRight && "text-right")}
                      aria-sort={
                        sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"
                      }
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "-mx-2 inline-flex h-8 items-center gap-1 rounded-md px-2 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40",
                            sorted && "text-foreground",
                          )}
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUpIcon className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon className="size-3.5" />
                          ) : (
                            <ArrowUpDownIcon className="size-3.5 opacity-50" />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
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
                  No accounts match &ldquo;{globalFilter}&rdquo;.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(numericColumns.has(cell.column.id) && "text-right")}
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
      <p className="text-xs text-muted-foreground">
        Showing {rows.length} of {accounts.length} accounts
      </p>
    </div>
  );
}
