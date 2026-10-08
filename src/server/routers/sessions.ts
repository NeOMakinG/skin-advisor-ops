import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { partners } from "@/data/partners";
import { products } from "@/data/products";
import { sessions } from "@/data/store";
import { inScope, scopeDates } from "@/domain/metrics";
import { SessionId } from "@/lib/ids";
import { Country } from "@/schemas/partner";
import { Scope } from "@/schemas/scope";
import { Browser, Device, Outcome, SkinTone } from "@/schemas/session";
import { publicProcedure, router } from "@/server/trpc";

export const SessionFilters = z.object({
  country: Country.nullable().default(null),
  device: Device.nullable().default(null),
  browser: Browser.nullable().default(null),
  skinTone: SkinTone.nullable().default(null),
  outcome: Outcome.nullable().default(null),
});
export type SessionFilters = z.infer<typeof SessionFilters>;

export const ListSessionsInput = Scope.extend({
  filters: SessionFilters.default({
    country: null,
    device: null,
    browser: null,
    skinTone: null,
    outcome: null,
  }),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(50).default(12),
});

const countryOf = new Map(partners.map((p) => [p.id, p.country]));

export const sessionsRouter = router({
  list: publicProcedure.input(ListSessionsInput).query(({ input }) => {
    const dates = scopeDates(input);
    const dated = sessions.map((s) => ({ ...s, date: s.startedAt.slice(0, 10) }));
    const f = input.filters;
    const matching = inScope(dated, input, dates).filter(
      (s) =>
        (f.country === null || countryOf.get(s.partnerId) === f.country) &&
        (f.device === null || s.device === f.device) &&
        (f.browser === null || s.browser === f.browser) &&
        (f.skinTone === null || s.skinTone === f.skinTone) &&
        (f.outcome === null || s.outcome === f.outcome),
    );
    const pageCount = Math.max(1, Math.ceil(matching.length / input.pageSize));
    const page = Math.min(input.page, pageCount);
    const start = (page - 1) * input.pageSize;
    return {
      total: matching.length,
      page,
      pageCount,
      rows: matching.slice(start, start + input.pageSize).map(({ date: _date, ...s }) => ({
        ...s,
        country: countryOf.get(s.partnerId) ?? "US",
      })),
    };
  }),

  byId: publicProcedure.input(z.object({ sessionId: SessionId })).query(({ input }) => {
    const session = sessions.find((s) => s.id === input.sessionId);
    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: `No session ${input.sessionId}.` });
    }
    const partner = partners.find((p) => p.id === session.partnerId);
    if (!partner) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const catalog = new Map(products.map((p) => [p.id, p]));
    return {
      ...session,
      partner,
      recommendations: session.recommendations.map((r) => {
        const product = catalog.get(r.productId);
        if (!product) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { ...r, product };
      }),
    };
  }),
});
