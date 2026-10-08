import { z } from "zod";
import {
  generateConcerns,
  generateDailyStats,
  generateLatency,
  generateProductStats,
  generateSessions,
} from "@/data/generate";
import { ProductStat } from "@/schemas/catalog";
import { ConcernDaily, DailyStat, LatencyPoint, Session } from "@/schemas/session";

// In-memory "database" for the static prototype. Generated deterministically, then parsed
// through the schemas so an invariant violation (a non-monotonic funnel, unordered
// percentiles) fails at load time rather than in a chart.
export const dailyStats = z.array(DailyStat).parse(generateDailyStats());
export const latencyPoints = z.array(LatencyPoint).parse(generateLatency());
export const concernDays = z.array(ConcernDaily).parse(generateConcerns(dailyStats));
export const productStats = z.array(ProductStat).parse(generateProductStats(dailyStats));
export const sessions = z.array(Session).parse(generateSessions());
