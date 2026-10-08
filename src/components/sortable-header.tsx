import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import type { ReactNode } from "react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Sortable <th>: aria-sort lives on the header cell, the button only toggles.
export function SortableHead({
  sorted,
  canSort,
  alignRight,
  onToggle,
  children,
}: {
  sorted: false | "asc" | "desc";
  canSort: boolean;
  alignRight?: boolean;
  onToggle?: (event: unknown) => void;
  children: ReactNode;
}) {
  return (
    <TableHead
      className={cn("whitespace-nowrap", alignRight && "text-right")}
      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
    >
      {canSort ? (
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "-mx-2 inline-flex h-8 items-center gap-1 rounded-md px-2 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40",
            sorted && "text-foreground",
          )}
        >
          {children}
          {sorted === "asc" ? (
            <ArrowUpIcon className="size-3.5" />
          ) : sorted === "desc" ? (
            <ArrowDownIcon className="size-3.5" />
          ) : (
            <ArrowUpDownIcon className="size-3.5 opacity-50" />
          )}
        </button>
      ) : (
        children
      )}
    </TableHead>
  );
}
