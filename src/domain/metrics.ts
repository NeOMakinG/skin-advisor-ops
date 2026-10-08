import { DATA_END } from "@/data/generate";
import { datesEnding } from "@/lib/dates";
import type { PartnerId } from "@/lib/ids";
import type { Country, Partner } from "@/schemas/partner";
import type { Scope } from "@/schemas/scope";
import {
  type Browser,
  type DailyStat,
  type Device,
  FailureReason,
  type LatencyPoint,
  type LatencyStep,
  Stage,
} from "@/schemas/session";

// Pure aggregations over the daily rows. No failure modes here, so no Effect.

export function scopeDates(scope: Scope, end = DATA_END): string[] {
  return datesEnding(end, scope.range);
}

export function inScope<T extends { date: string; partnerId: PartnerId }>(
  rows: T[],
  scope: Scope,
  dates = scopeDates(scope),
): T[] {
  const allowed = new Set(dates);
  return rows.filter(
    (r) => allowed.has(r.date) && (scope.partner === "all" || r.partnerId === scope.partner),
  );
}

export type FunnelTotals = Record<Stage, number>;

export function funnelTotals(rows: DailyStat[]): FunnelTotals {
  const totals: FunnelTotals = {
    started: 0,
    selfie: 0,
    analyzed: 0,
    recommended: 0,
    clicked: 0,
    purchased: 0,
  };
  for (const row of rows) {
    for (const stage of Stage.options) totals[stage] += row[stage];
  }
  return totals;
}

export interface FunnelStep {
  stage: Stage;
  count: number;
  /** Share of started sessions. */
  ofStarted: number;
  /** Share of the previous stage. */
  ofPrevious: number;
}

export function funnelSteps(totals: FunnelTotals): FunnelStep[] {
  return Stage.options.map((stage, i) => {
    const previous = i === 0 ? totals.started : totals[Stage.options[i - 1] as Stage];
    return {
      stage,
      count: totals[stage],
      ofStarted: ratio(totals[stage], totals.started),
      ofPrevious: ratio(totals[stage], previous),
    };
  });
}

export interface Kpis {
  sessions: number;
  /** Sessions that produced an analysis, over sessions started. */
  completionRate: number;
  /** Sessions that clicked a recommended product, over sessions recommended. */
  clickRate: number;
  /** Purchase rate of advisor sessions against the partner's baseline, as a multiplier - 1. */
  conversionUplift: number;
}

export function kpis(rows: DailyStat[], partners: Partner[]): Kpis {
  const totals = funnelTotals(rows);
  const baseline = new Map(partners.map((p) => [p.id, p.baselineConversion]));
  // Expected purchases if every started session converted at its partner's baseline.
  let expected = 0;
  for (const row of rows) expected += row.started * (baseline.get(row.partnerId) ?? 0);
  return {
    sessions: totals.started,
    completionRate: ratio(totals.analyzed, totals.started),
    clickRate: ratio(totals.clicked, totals.recommended),
    conversionUplift: expected === 0 ? 0 : totals.purchased / expected - 1,
  };
}

export interface DayVolume {
  date: string;
  started: number;
  analyzed: number;
  purchased: number;
}

export function volumeByDay(rows: DailyStat[], dates: string[]): DayVolume[] {
  const byDate = new Map<string, DayVolume>(
    dates.map((date) => [date, { date, started: 0, analyzed: 0, purchased: 0 }]),
  );
  for (const row of rows) {
    const day = byDate.get(row.date);
    if (!day) continue;
    day.started += row.started;
    day.analyzed += row.analyzed;
    day.purchased += row.purchased;
  }
  return [...byDate.values()];
}

export type FailureDay = { date: string } & Record<FailureReason, number>;

export function failuresByDay(rows: DailyStat[], dates: string[]): FailureDay[] {
  const byDate = new Map<string, FailureDay>(dates.map((date) => [date, emptyFailureDay(date)]));
  for (const row of rows) {
    const day = byDate.get(row.date);
    if (!day) continue;
    for (const reason of FailureReason.options) day[reason] += row.failures[reason] ?? 0;
  }
  return [...byDate.values()];
}

function emptyFailureDay(date: string): FailureDay {
  return {
    date,
    face_not_detected: 0,
    low_light: 0,
    camera_blocked: 0,
    timeout: 0,
    low_confidence: 0,
    other: 0,
  };
}

export interface FailureShare {
  reason: FailureReason;
  count: number;
  share: number;
}

export function failureShares(rows: DailyStat[]): FailureShare[] {
  const counts = emptyFailureDay("");
  let total = 0;
  for (const row of rows) {
    for (const reason of FailureReason.options) {
      const n = row.failures[reason] ?? 0;
      counts[reason] += n;
      total += n;
    }
  }
  return FailureReason.options
    .map((reason) => ({ reason, count: counts[reason], share: ratio(counts[reason], total) }))
    .sort((a, b) => b.count - a.count);
}

export interface FailureSegment {
  key: string;
  device: Device;
  browser: Browser;
  country: Country;
  started: number;
  failed: number;
  failRate: number;
  topReason: FailureReason;
  topReasonShare: number;
}

/** Failure rate per device, browser and country, so a bad combination stands out. */
export function failureBreakdown(rows: DailyStat[], partners: Partner[]): FailureSegment[] {
  const country = new Map(partners.map((p) => [p.id, p.country]));
  const segments = new Map<string, FailureSegment & { reasons: Record<FailureReason, number> }>();
  for (const row of rows) {
    const c = country.get(row.partnerId);
    if (!c) continue;
    const key = `${row.device}|${row.browser}|${c}`;
    let seg = segments.get(key);
    if (!seg) {
      seg = {
        key,
        device: row.device,
        browser: row.browser,
        country: c,
        started: 0,
        failed: 0,
        failRate: 0,
        topReason: "other",
        topReasonShare: 0,
        reasons: emptyFailureDay("") as unknown as Record<FailureReason, number>,
      };
      segments.set(key, seg);
    }
    seg.started += row.started;
    for (const reason of FailureReason.options) {
      const n = row.failures[reason] ?? 0;
      seg.failed += n;
      seg.reasons[reason] += n;
    }
  }
  return [...segments.values()].map(({ reasons, ...seg }) => {
    const [top] = FailureReason.options
      .map((reason) => [reason, reasons[reason]] as const)
      .sort((a, b) => b[1] - a[1]);
    return {
      ...seg,
      failRate: ratio(seg.failed, seg.started),
      topReason: top?.[0] ?? "other",
      topReasonShare: ratio(top?.[1] ?? 0, seg.failed),
    };
  });
}

export interface LatencyDay {
  date: string;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * Percentiles per day for one step. With several partners in scope the daily values are
 * averaged, weighted by that partner's session volume: an approximation that keeps a
 * single-partner spike visible without pretending to merge raw distributions.
 */
export function latencySeries(
  points: LatencyPoint[],
  volumes: DailyStat[],
  step: LatencyStep,
  dates: string[],
): LatencyDay[] {
  const weight = new Map<string, number>();
  for (const row of volumes) {
    const key = `${row.partnerId}|${row.date}`;
    weight.set(key, (weight.get(key) ?? 0) + row.started);
  }
  return dates.map((date) => {
    const acc = { p50: 0, p95: 0, p99: 0, w: 0 };
    for (const p of points) {
      if (p.date !== date || p.step !== step) continue;
      const w = weight.get(`${p.partnerId}|${date}`) ?? 0;
      acc.p50 += p.p50 * w;
      acc.p95 += p.p95 * w;
      acc.p99 += p.p99 * w;
      acc.w += w;
    }
    const div = acc.w || 1;
    return {
      date,
      p50: Math.round(acc.p50 / div),
      p95: Math.round(acc.p95 / div),
      p99: Math.round(acc.p99 / div),
    };
  });
}

export function ratio(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole;
}
