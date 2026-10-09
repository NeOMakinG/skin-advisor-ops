import { describe, expect, it } from "vitest";
import { partners } from "@/data/partners";
import { concernDays, dailyStats, latencyPoints } from "@/data/store";
import {
  funnelSteps,
  funnelTotals,
  inScope,
  kpis,
  scopeDates,
  volumeByDay,
} from "@/domain/metrics";
import { Stage } from "@/schemas/session";

const ranges = [7, 14, 28] as const;

describe("fixture invariants", () => {
  it("keeps every funnel row nonnegative and monotonic", () => {
    for (const row of dailyStats) {
      for (const stage of Stage.options) {
        expect(Number.isInteger(row[stage])).toBe(true);
        expect(row[stage]).toBeGreaterThanOrEqual(0);
      }
      for (let i = 1; i < Stage.options.length; i++) {
        const stage = Stage.options[i];
        const previous = Stage.options[i - 1];
        if (stage && previous) expect(row[stage]).toBeLessThanOrEqual(row[previous]);
      }
      expect(
        Object.values(row.failures).reduce((sum, count) => sum + count, 0),
      ).toBeLessThanOrEqual(row.started - row.analyzed);
    }
  });

  it("matches aggregate totals with partner and daily partitions", () => {
    for (const range of ranges) {
      const scope = { partner: "all", range } as const;
      const rows = inScope(dailyStats, scope);
      const totals = funnelTotals(rows);
      const byPartner = partners.map((partner) =>
        funnelTotals(inScope(dailyStats, { partner: partner.id, range })),
      );
      for (const stage of Stage.options) {
        expect(totals[stage]).toBe(byPartner.reduce((sum, part) => sum + part[stage], 0));
      }
      const daily = volumeByDay(rows, scopeDates(scope));
      for (const stage of ["started", "analyzed", "purchased"] as const) {
        expect(totals[stage]).toBe(daily.reduce((sum, part) => sum + part[stage], 0));
      }
    }
  });

  it("uses the same fixture values for KPI and funnel views", () => {
    for (const range of ranges) {
      for (const partner of partners) {
        const rows = inScope(dailyStats, { partner: partner.id, range });
        const totals = funnelTotals(rows);
        const steps = funnelSteps(totals);
        const summary = kpis(rows, partners);
        expect(summary.sessions).toBe(totals.started);
        expect(summary.completionRate).toBe(totals.started ? totals.analyzed / totals.started : 0);
        expect(summary.clickRate).toBe(
          totals.recommended ? totals.clicked / totals.recommended : 0,
        );
        for (const step of steps) expect(step.count).toBe(totals[step.stage]);
      }
    }
  });

  it("derives concern counts from analyzed sessions and orders latency percentiles", () => {
    for (const day of concernDays) {
      const analyzed = dailyStats
        .filter((row) => row.partnerId === day.partnerId && row.date === day.date)
        .reduce((sum, row) => sum + row.analyzed, 0);
      expect(day.analyzed).toBe(analyzed);
      for (const count of Object.values(day.concerns)) {
        expect(count).toBeGreaterThanOrEqual(0);
        expect(count).toBeLessThanOrEqual(analyzed);
      }
    }
    for (const point of latencyPoints) {
      expect(point.p50).toBeGreaterThanOrEqual(0);
      expect(point.p50).toBeLessThanOrEqual(point.p95);
      expect(point.p95).toBeLessThanOrEqual(point.p99);
    }
  });
});
