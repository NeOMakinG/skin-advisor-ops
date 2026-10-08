import { describe, expect, it } from "vitest";
import { DATA_DAYS, DATA_END } from "@/data/generate";
import { partners } from "@/data/partners";
import { dailyStats, latencyPoints } from "@/data/store";
import { PartnerId } from "@/lib/ids";
import {
  failureBreakdown,
  failureShares,
  funnelSteps,
  funnelTotals,
  inScope,
  kpis,
  latencySeries,
  scopeDates,
} from "./metrics";

const all = { partner: "all", range: 28 } as const;

describe("mock data", () => {
  it("covers roughly 250k sessions over 28 days with the specified failure mix", () => {
    const totals = funnelTotals(dailyStats);
    expect(totals.started).toBeGreaterThan(240_000);
    expect(totals.started).toBeLessThan(265_000);
    expect(scopeDates(all)).toHaveLength(DATA_DAYS);
    expect(scopeDates(all).at(-1)).toBe(DATA_END);

    const shares = Object.fromEntries(failureShares(dailyStats).map((s) => [s.reason, s.share]));
    expect(shares.face_not_detected).toBeCloseTo(0.31, 1);
    expect(shares.low_light).toBeCloseTo(0.24, 1);
    expect(shares.camera_blocked).toBeCloseTo(0.18, 1);
    expect(shares.timeout).toBeCloseTo(0.12, 1);
  });

  it("keeps analysis latency near the stated baseline with incident spikes", () => {
    const analysis = latencyPoints.filter((p) => p.step === "analysis");
    const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
    expect(median(analysis.map((p) => p.p50))).toBeGreaterThan(700);
    expect(median(analysis.map((p) => p.p50))).toBeLessThan(860);
    expect(median(analysis.map((p) => p.p95))).toBeGreaterThan(1900);
    expect(median(analysis.map((p) => p.p95))).toBeLessThan(2300);
    expect(Math.max(...analysis.map((p) => p.p99))).toBeGreaterThanOrEqual(6000);
  });
});

describe("funnel", () => {
  it("produces monotonic steps with conversion against start and previous stage", () => {
    const steps = funnelSteps(funnelTotals(inScope(dailyStats, all)));
    expect(steps.map((s) => s.stage)).toEqual([
      "started",
      "selfie",
      "analyzed",
      "recommended",
      "clicked",
      "purchased",
    ]);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]?.count).toBeLessThanOrEqual(steps[i - 1]?.count ?? 0);
    }
    expect(steps[0]?.ofStarted).toBe(1);
    expect(steps[3]?.ofPrevious).toBeCloseTo(0.97, 1);
  });

  it("computes uplift against each partner's baseline", () => {
    const highstreet = { partner: PartnerId.parse("prt_highstreet"), range: 7 } as const;
    const k = kpis(inScope(dailyStats, highstreet), partners);
    expect(k.sessions).toBeGreaterThan(20_000);
    expect(k.completionRate).toBeGreaterThan(0.65);
    expect(k.completionRate).toBeLessThan(0.8);
    expect(k.clickRate).toBeGreaterThan(0.3);
    expect(k.conversionUplift).toBeGreaterThan(0.5);
  });
});

describe("failure breakdown", () => {
  it("surfaces Galaxy S24 camera denials at Coastline Drug", () => {
    const coastline = { partner: PartnerId.parse("prt_coastline"), range: 7 } as const;
    const segments = failureBreakdown(inScope(dailyStats, coastline), partners).sort(
      (a, b) => b.failRate - a.failRate,
    );
    const galaxy = segments.filter((s) => s.device === "Galaxy S24");
    expect(galaxy.length).toBeGreaterThan(0);
    for (const seg of galaxy) {
      expect(seg.country).toBe("US");
      expect(seg.topReason).toBe("camera_blocked");
    }
    expect(segments[0]?.device).toBe("Galaxy S24");
  });
});

describe("latency series", () => {
  it("keeps a partner-wide incident visible in the pooled view", () => {
    const dates = scopeDates(all);
    const series = latencySeries(
      inScope(latencyPoints, all),
      inScope(dailyStats, all),
      "analysis",
      dates,
    );
    expect(series).toHaveLength(DATA_DAYS);
    const incidentDay = series.find((d) => d.date === "2026-09-18");
    const quietDay = series.find((d) => d.date === "2026-09-17");
    expect(incidentDay?.p99).toBe(9800);
    expect(quietDay?.p99).toBeLessThan(5000);
  });
});
