import type { FunnelStep } from "@/domain/metrics";
import { formatCount, formatPercent } from "@/lib/format";
import { stageLabel } from "@/schemas/session";

// A session ladder: each stage as a bar sized against sessions started, with the step
// conversion from the previous stage next to it. Plain HTML, so it reads at 390px too.
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const last = steps.length - 1;
  return (
    <ol className="flex flex-col gap-3" aria-label="Session funnel">
      {steps.map((step, i) => (
        <li
          key={step.stage}
          className="grid grid-cols-[7.5rem_1fr] items-center gap-3 sm:grid-cols-[9rem_1fr_6.5rem]"
        >
          <span className="text-sm">{stageLabel[step.stage]}</span>
          <div className="flex items-center gap-2">
            <div className="h-5 min-w-0 flex-1 rounded-sm bg-secondary">
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${Math.max(0.8, step.ofStarted * 100)}%`,
                  background: `color-mix(in oklch, var(--ramp-1), var(--ramp-3) ${(i / last) * 100}%)`,
                }}
                role="img"
                aria-label={`${stageLabel[step.stage]}: ${formatCount(step.count)} sessions, ${formatPercent(step.ofStarted)} of started`}
              />
            </div>
            <span className="tabular w-16 shrink-0 text-right text-sm font-medium">
              {formatCount(step.count)}
            </span>
          </div>
          <span className="tabular col-start-2 -mt-2 text-xs text-muted-foreground sm:col-start-3 sm:mt-0 sm:text-right">
            {i === 0 ? "100% of started" : `${formatPercent(step.ofPrevious, 0)} of previous`}
          </span>
        </li>
      ))}
    </ol>
  );
}
