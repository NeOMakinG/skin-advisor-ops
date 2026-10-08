import { Context, Data, Effect } from "effect";
import { datesEnding } from "@/lib/dates";
import type { PartnerId } from "@/lib/ids";
import { Concern, type ConcernDaily } from "@/schemas/session";

// Diagnostic drift: compare the share of analyzed sessions flagged with each concern over
// the last seven days against the seven days before. A shift above the threshold is the
// earliest public signal of a model regression, long before a partner complains.

export const DRIFT_THRESHOLD_PP = 3;
export const MIN_ANALYZED_PER_WEEK = 1000;

export class InsufficientSamples extends Data.TaggedError("InsufficientSamples")<{
  readonly week: "current" | "previous";
  readonly analyzed: number;
  readonly required: number;
}> {}

export class NoConcernData extends Data.TaggedError("NoConcernData")<{
  readonly partner: PartnerId | "all";
}> {}

export type DriftError = InsufficientSamples | NoConcernData;

export class ConcernRepo extends Context.Service<
  ConcernRepo,
  { readonly days: (partner: PartnerId | "all") => ConcernDaily[] }
>()("ConcernRepo") {}

export interface Week {
  from: string;
  to: string;
  analyzed: number;
}

export interface ConcernShift {
  concern: Concern;
  previousShare: number;
  currentShare: number;
  /** Percentage points, current minus previous. */
  deltaPp: number;
  flagged: boolean;
}

export interface DriftReport {
  partner: PartnerId | "all";
  current: Week;
  previous: Week;
  shifts: ConcernShift[];
  /** Flagged concerns, largest absolute shift first. */
  flagged: ConcernShift[];
}

function summarize(days: ConcernDaily[], dates: string[]) {
  const allowed = new Set(dates);
  const rows = days.filter((d) => allowed.has(d.date));
  const analyzed = rows.reduce((sum, d) => sum + d.analyzed, 0);
  const counts = Object.fromEntries(Concern.options.map((c) => [c, 0])) as Record<Concern, number>;
  for (const row of rows) {
    for (const concern of Concern.options) counts[concern] += row.concerns[concern] ?? 0;
  }
  return { analyzed, counts };
}

/** Builds the week-over-week report, or fails when a week is too thin to compare. */
export const detectDrift = Effect.fn("detectDrift")(function* (
  partner: PartnerId | "all",
  endDate: string,
) {
  const repo = yield* ConcernRepo;
  const days = repo.days(partner);
  if (days.length === 0) return yield* new NoConcernData({ partner });

  const currentDates = datesEnding(endDate, 7);
  const previousDates = datesEnding(currentDates[0] ?? endDate, 8).slice(0, 7);
  const current = summarize(days, currentDates);
  const previous = summarize(days, previousDates);

  for (const [week, summary] of [
    ["previous", previous],
    ["current", current],
  ] as const) {
    if (summary.analyzed < MIN_ANALYZED_PER_WEEK) {
      return yield* new InsufficientSamples({
        week,
        analyzed: summary.analyzed,
        required: MIN_ANALYZED_PER_WEEK,
      });
    }
  }

  const shifts: ConcernShift[] = Concern.options.map((concern) => {
    const previousShare = previous.counts[concern] / previous.analyzed;
    const currentShare = current.counts[concern] / current.analyzed;
    const deltaPp = (currentShare - previousShare) * 100;
    return {
      concern,
      previousShare,
      currentShare,
      deltaPp,
      flagged: Math.abs(deltaPp) >= DRIFT_THRESHOLD_PP,
    };
  });

  return {
    partner,
    current: week(currentDates, current.analyzed),
    previous: week(previousDates, previous.analyzed),
    shifts,
    flagged: shifts
      .filter((s) => s.flagged)
      .sort((a, b) => Math.abs(b.deltaPp) - Math.abs(a.deltaPp)),
  } satisfies DriftReport;
});

function week(dates: string[], analyzed: number): Week {
  return { from: dates[0] ?? "", to: dates[dates.length - 1] ?? "", analyzed };
}

export function driftErrorMessage(error: DriftError): string {
  switch (error._tag) {
    case "InsufficientSamples":
      return `The ${error.week} week has ${error.analyzed.toLocaleString("en-US")} analyzed sessions. At least ${error.required.toLocaleString("en-US")} are needed before shares are comparable.`;
    case "NoConcernData":
      return "No analyzed sessions in this scope yet.";
  }
}
