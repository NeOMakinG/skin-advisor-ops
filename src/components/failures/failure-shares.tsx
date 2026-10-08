import { failureConfig } from "@/components/failures/failure-colors";
import type { FailureShare } from "@/domain/metrics";
import { formatCount, formatPercent } from "@/lib/format";
import { failureLabel } from "@/schemas/session";

// Ranked list of reasons. Doubles as the legend for the stacked chart next to it.
export function FailureShares({ shares }: { shares: FailureShare[] }) {
  const max = shares[0]?.share ?? 1;
  return (
    <ol className="flex flex-col gap-2.5" aria-label="Failure reasons">
      {shares.map((s) => (
        <li
          key={s.reason}
          className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1 text-sm"
        >
          <span
            className="size-2.5 rounded-[2px]"
            style={{ backgroundColor: failureConfig[s.reason].color }}
            aria-hidden="true"
          />
          <span className="truncate">{failureLabel[s.reason]}</span>
          <span className="tabular text-right">
            <span className="font-medium">{formatPercent(s.share, 0)}</span>
            <span className="ml-1.5 text-xs text-muted-foreground">{formatCount(s.count)}</span>
          </span>
          <div className="col-start-2 col-end-4 h-1 rounded-full bg-secondary">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(s.share / max) * 100}%`,
                backgroundColor: failureConfig[s.reason].color,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
