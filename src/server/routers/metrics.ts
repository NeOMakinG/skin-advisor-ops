import { TRPCError } from "@trpc/server";
import { Effect, Result } from "effect";
import { z } from "zod";
import { DATA_END } from "@/data/generate";
import { incidents } from "@/data/incidents";
import { partners } from "@/data/partners";
import { products } from "@/data/products";
import { concernDays, dailyStats, latencyPoints, productStats } from "@/data/store";
import {
  ConcernRepo,
  type DriftError,
  type DriftReport,
  detectDrift,
  driftErrorMessage,
} from "@/domain/drift";
import {
  failureBreakdown,
  failureShares,
  failuresByDay,
  funnelSteps,
  funnelTotals,
  inScope,
  kpis,
  latencySeries,
  ratio,
  scopeDates,
  volumeByDay,
} from "@/domain/metrics";
import { addDays } from "@/lib/dates";
import type { PartnerId } from "@/lib/ids";
import { Scope } from "@/schemas/scope";
import { LatencyStep } from "@/schemas/session";
import { publicProcedure, router } from "@/server/trpc";

const concernLayer = Effect.provideService(ConcernRepo, {
  days: (partner) => concernDays.filter((d) => partner === "all" || d.partnerId === partner),
});

export type DriftOutcome =
  | { kind: "report"; report: DriftReport }
  | { kind: "unavailable"; error: DriftError["_tag"]; message: string };

async function runDrift(partner: PartnerId | "all"): Promise<DriftOutcome> {
  const result = await Effect.runPromise(
    detectDrift(partner, DATA_END).pipe(concernLayer, Effect.result),
  );
  if (Result.isFailure(result)) {
    const error = result.failure;
    return { kind: "unavailable", error: error._tag, message: driftErrorMessage(error) };
  }
  return { kind: "report", report: result.success };
}

export const metricsRouter = router({
  overview: publicProcedure.input(Scope).query(({ input }) => {
    const dates = scopeDates(input);
    const rows = inScope(dailyStats, input, dates);
    // The window just before this one, for deltas. The 28-day range has no history before it.
    const previousDates =
      input.range === 28 ? [] : scopeDates(input, addDays(dates[0] ?? DATA_END, -1));
    const previousRows = previousDates.length ? inScope(dailyStats, input, previousDates) : [];
    return {
      dates,
      kpis: kpis(rows, partners),
      previousKpis: previousRows.length ? kpis(previousRows, partners) : null,
      funnel: funnelSteps(funnelTotals(rows)),
      volume: volumeByDay(rows, dates),
    };
  }),

  drift: publicProcedure.input(Scope.pick({ partner: true })).query(async ({ input }) => {
    const scoped = await runDrift(input.partner);
    // In the pooled view a single partner's regression is diluted, so each partner is also
    // checked on its own and the flags are surfaced next to the pooled chart.
    const perPartner =
      input.partner === "all"
        ? await Promise.all(
            partners.map(async (p) => ({ partnerId: p.id, outcome: await runDrift(p.id) })),
          )
        : [];
    // Model rollouts in the current week are the first thing to check when a share moves.
    const rollouts = incidents.filter(
      (i) =>
        i.durationMin === 0 &&
        i.date > addDays(DATA_END, -7) &&
        (input.partner === "all" || i.partnerId === null || i.partnerId === input.partner),
    );
    return { scoped, perPartner, rollouts };
  }),

  failures: publicProcedure.input(Scope).query(({ input }) => {
    const dates = scopeDates(input);
    const rows = inScope(dailyStats, input, dates);
    const totals = funnelTotals(rows);
    const shares = failureShares(rows);
    const failed = shares.reduce((sum, s) => sum + s.count, 0);
    const stats = productStats.filter(
      (s) => input.partner === "all" || s.partnerId === input.partner,
    );
    const catalog = new Map(products.map((p) => [p.id, p]));
    const partnerById = new Map(partners.map((p) => [p.id, p]));
    return {
      dates,
      byDay: failuresByDay(rows, dates),
      shares,
      failed,
      failRate: ratio(failed, totals.started),
      segments: failureBreakdown(rows, partners).sort((a, b) => b.failRate - a.failRate),
      // Recommendations that get served but rarely clicked, lowest click rate first.
      stalling: stats
        .map((s) => {
          const product = catalog.get(s.productId);
          const partner = partnerById.get(s.partnerId);
          if (!product || !partner) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          return {
            productId: s.productId,
            name: product.name,
            partnerName: partner.name,
            currency: partner.currency,
            price: product.price,
            served: s.served,
            clickRate: ratio(s.clicked, s.served),
            avgMatch: s.avgMatch,
            outOfStockDays: s.outOfStockDays,
          };
        })
        .sort((a, b) => a.clickRate - b.clickRate)
        .slice(0, 6),
    };
  }),

  latency: publicProcedure.input(Scope).query(({ input }) => {
    const dates = scopeDates(input);
    const rows = inScope(dailyStats, input, dates);
    const points = inScope(latencyPoints, input, dates);
    const allowed = new Set(dates);
    return {
      dates,
      steps: LatencyStep.options.map((step) => ({
        step,
        series: latencySeries(points, rows, step, dates),
      })),
      incidents: incidents
        .filter(
          (i) =>
            allowed.has(i.date) &&
            (input.partner === "all" || i.partnerId === null || i.partnerId === input.partner),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    };
  }),

  budget: publicProcedure.input(z.object({})).query(() => ({
    // Latency budgets the partner team holds the pipeline to, in milliseconds.
    upload: { p95: 1500 },
    analysis: { p95: 2500 },
    recommend: { p95: 700 },
  })),
});
