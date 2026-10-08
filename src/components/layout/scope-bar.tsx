import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDay } from "@/lib/dates";
import { useScope, useSetScope } from "@/lib/scope";
import { useTRPC } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { PartnerScope, type RangeDays } from "@/schemas/scope";

const ranges: { value: RangeDays; label: string }[] = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 28, label: "28 days" },
];

// One filter row above every screen. Changing it re-scopes all charts and tables at once.
export function ScopeBar() {
  const trpc = useTRPC();
  const scope = useScope();
  const setScope = useSetScope();
  const partnersQuery = useQuery(trpc.partners.list.queryOptions());
  const partners = partnersQuery.data?.partners ?? [];

  return (
    <div className="border-t bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-2">
          <Label htmlFor="partner" className="text-muted-foreground">
            Partner
          </Label>
          <Select
            value={scope.partner}
            onValueChange={(value) => void setScope({ partner: PartnerScope.parse(value) })}
          >
            <SelectTrigger id="partner" size="sm" className="min-w-44" aria-label="Partner">
              <SelectValue placeholder="All partners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All partners</SelectItem>
              {partners.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                  <span className="text-muted-foreground">{p.country}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Time range</legend>
          <span aria-hidden="true" className="text-sm text-muted-foreground">
            Range
          </span>
          <div className="flex rounded-md border border-input bg-card p-0.5 shadow-xs">
            {ranges.map((r) => {
              const active = r.value === scope.range;
              return (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => void setScope({ range: r.value })}
                  className={cn(
                    "h-7 rounded-[5px] px-2.5 text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <p className="ml-auto text-xs text-muted-foreground">
          {partnersQuery.data
            ? `Daily aggregates through ${formatDay(partnersQuery.data.dataThrough, "long")}`
            : " "}
        </p>
      </div>
    </div>
  );
}
