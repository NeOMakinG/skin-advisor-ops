import type { ChartConfig } from "@/components/ui/chart";
import { FailureReason, failureLabel } from "@/schemas/session";

// Each reason keeps its slot whatever the filter shows, so a color never changes meaning.
export const failureConfig = Object.fromEntries(
  FailureReason.options.map((reason, i) => [
    reason,
    { label: failureLabel[reason], color: `var(--series-${i + 1})` },
  ]),
) as Record<FailureReason, { label: string; color: string }> satisfies ChartConfig;
