import type { z } from "zod";
import { incidents } from "@/data/incidents";
import { partners } from "@/data/partners";
import { products } from "@/data/products";
import { rng } from "@/data/random";
import { datesEnding, weekday } from "@/lib/dates";
import type { PartnerId } from "@/lib/ids";
import type { ProductStat } from "@/schemas/catalog";
import type { Partner } from "@/schemas/partner";
import type {
  Browser,
  Concern,
  ConcernDaily,
  DailyStat,
  Device,
  FailureReason,
  LatencyPoint,
  LatencyStep,
  Outcome,
  Session,
  SkinTone,
} from "@/schemas/session";

// Generators produce schema *input* (plain string ids); the store parses them into branded rows.
type DailyStatInput = z.input<typeof DailyStat>;
type LatencyInput = z.input<typeof LatencyPoint>;
type ConcernInput = z.input<typeof ConcernDaily>;
type ProductStatInput = z.input<typeof ProductStat>;
type SessionInput = z.input<typeof Session>;
type PartnerKey = "prt_nordbeauty" | "prt_highstreet" | "prt_sakura" | "prt_coastline";

// Data covers the 28 days ending the day before "today" (2026-10-08).
export const DATA_END = "2026-10-07";
export const DATA_DAYS = 28;
export const allDates = datesEnding(DATA_END, DATA_DAYS);

// ---------------------------------------------------------------------------------------
// Business parameters. Everything the dashboard shows derives from these.
// ---------------------------------------------------------------------------------------

interface Profile {
  /** Advisor sessions per day once the deployment is warmed up. */
  dailySessions: number;
  deviceMix: Record<Device, number>;
  skinToneMix: Record<SkinTone, number>;
  /** Share of recommended sessions that click a product, and of clicks that buy. */
  clickRate: number;
  buyRate: number;
  /** Share of analyzed sessions flagged with each concern (a session can have several). */
  concerns: Record<Concern, number>;
}

const profiles: Record<PartnerKey, Profile> = {
  prt_nordbeauty: {
    dailySessions: 2850,
    deviceMix: { "iPhone 15": 0.44, "Galaxy S24": 0.2, "Pixel 8": 0.07, Desktop: 0.29 },
    skinToneMix: { "1": 0.3, "2": 0.38, "3": 0.2, "4": 0.08, "5": 0.03, "6": 0.01 },
    clickRate: 0.33,
    buyRate: 0.115,
    concerns: {
      dryness: 0.44,
      oiliness: 0.14,
      redness: 0.23,
      dark_spots: 0.17,
      wrinkles: 0.31,
      acne: 0.11,
      dark_circles: 0.26,
      uneven_tone: 0.19,
    },
  },
  prt_highstreet: {
    dailySessions: 3600,
    deviceMix: { "iPhone 15": 0.5, "Galaxy S24": 0.26, "Pixel 8": 0.09, Desktop: 0.15 },
    skinToneMix: { "1": 0.22, "2": 0.33, "3": 0.22, "4": 0.12, "5": 0.08, "6": 0.03 },
    clickRate: 0.36,
    buyRate: 0.13,
    concerns: {
      dryness: 0.36,
      oiliness: 0.22,
      redness: 0.21,
      dark_spots: 0.24,
      wrinkles: 0.27,
      acne: 0.19,
      dark_circles: 0.29,
      uneven_tone: 0.23,
    },
  },
  prt_sakura: {
    dailySessions: 2400,
    deviceMix: { "iPhone 15": 0.3, "Galaxy S24": 0.38, "Pixel 8": 0.05, Desktop: 0.27 },
    skinToneMix: { "1": 0.02, "2": 0.1, "3": 0.3, "4": 0.36, "5": 0.18, "6": 0.04 },
    clickRate: 0.31,
    buyRate: 0.09,
    concerns: {
      dryness: 0.12,
      oiliness: 0.46,
      redness: 0.18,
      dark_spots: 0.3,
      wrinkles: 0.1,
      acne: 0.33,
      dark_circles: 0.22,
      uneven_tone: 0.28,
    },
  },
  prt_coastline: {
    dailySessions: 1250,
    deviceMix: { "iPhone 15": 0.47, "Galaxy S24": 0.21, "Pixel 8": 0.08, Desktop: 0.24 },
    skinToneMix: { "1": 0.18, "2": 0.28, "3": 0.22, "4": 0.14, "5": 0.12, "6": 0.06 },
    clickRate: 0.3,
    buyRate: 0.1,
    concerns: {
      dryness: 0.38,
      oiliness: 0.2,
      redness: 0.22,
      dark_spots: 0.2,
      wrinkles: 0.29,
      acne: 0.16,
      dark_circles: 0.27,
      uneven_tone: 0.21,
    },
  },
};

const browserMix: Record<Device, Partial<Record<Browser, number>>> = {
  "iPhone 15": { Safari: 0.86, Chrome: 0.14 },
  "Galaxy S24": { Chrome: 0.58, "Samsung Internet": 0.42 },
  "Pixel 8": { Chrome: 1 },
  Desktop: { Chrome: 0.56, Safari: 0.19, Edge: 0.16, Firefox: 0.09 },
};

// Share of started sessions lost to each reason on a normal day (19% overall), in the
// proportions the spec gives: 31 / 24 / 18 / 12 / 9 / 6.
const FAILURE_RATE = 0.19;
const failureMix: Record<FailureReason, number> = {
  face_not_detected: 0.31,
  low_light: 0.24,
  camera_blocked: 0.18,
  timeout: 0.12,
  low_confidence: 0.09,
  other: 0.06,
};
const ABANDON_RATE = 0.09;

// Model 2.3 shipped to Sakura Skin on this day and shifted its concern distribution.
const SAKURA_MODEL_ROLLOUT = "2026-09-30";
const sakuraAfterRollout: Partial<Record<Concern, number>> = { redness: 0.28, dark_spots: 0.25 };

const latencyBaseline: Record<LatencyStep, { p50: number; p95: number; p99: number }> = {
  upload: { p50: 420, p95: 1300, p99: 2600 },
  analysis: { p50: 780, p95: 2100, p99: 3800 },
  recommend: { p50: 190, p95: 520, p99: 900 },
};
const latencyModifier: Record<PartnerKey, Partial<Record<LatencyStep, number>>> = {
  prt_nordbeauty: {},
  prt_highstreet: { recommend: 1.1 },
  prt_sakura: { upload: 1.35 },
  prt_coastline: { analysis: 0.95 },
};

// ---------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------

function profileOf(partner: Partner): Profile {
  const profile = profiles[partner.id as PartnerKey];
  if (!profile) throw new Error(`No generator profile for ${partner.id}`);
  return profile;
}

function isLive(partner: Partner, date: string) {
  return date >= partner.launchedAt;
}

/** Volume ramp for a fresh deployment plus a mild weekly rhythm. */
function volumeFactor(partner: Partner, date: string) {
  const daysLive = (Date.parse(date) - Date.parse(partner.launchedAt)) / 86_400_000;
  const ramp = Math.min(1, 0.35 + daysLive * 0.09);
  const day = weekday(date);
  const weekly = day === 0 || day === 6 ? (partner.channel === "app" ? 1.08 : 0.86) : 1;
  return ramp * weekly;
}

function incidentFor(partnerId: PartnerId, date: string, step?: LatencyStep) {
  return incidents.find(
    (i) =>
      i.date === date &&
      (i.partnerId === null || i.partnerId === partnerId) &&
      (step === undefined || i.step === step),
  );
}

function failureMultiplier(
  partnerId: PartnerId,
  date: string,
  device: Device,
  reason: FailureReason,
): number {
  let m = 1;
  if (reason === "camera_blocked" && device === "Desktop") m *= 1.8;
  // Coastline's Android traffic hits a new permission prompt in Chrome 130+.
  if (reason === "camera_blocked" && device === "Galaxy S24" && partnerId === "prt_coastline") {
    m *= 2.4;
  }
  if (reason === "low_light" && partnerId === "prt_sakura") m *= 1.3;
  if (reason === "low_confidence" && device === "Pixel 8") m *= 1.2;
  const incident = incidentFor(partnerId, date);
  if (incident && incident.durationMin > 0) {
    if (reason === "timeout") m *= incident.partnerId === null ? 3 : 2.5;
    if (reason === "other" && incident.step === "upload") m *= 2;
  }
  return m;
}

// ---------------------------------------------------------------------------------------
// Generators. Each row is seeded by its own key, so rows never depend on generation order.
// ---------------------------------------------------------------------------------------

export function generateDailyStats(): DailyStatInput[] {
  const rows: DailyStatInput[] = [];
  for (const partner of partners) {
    const profile = profileOf(partner);
    for (const date of allDates) {
      if (!isLive(partner, date)) continue;
      const volume = profile.dailySessions * volumeFactor(partner, date);
      for (const device of Object.keys(profile.deviceMix) as Device[]) {
        for (const [browser, share] of Object.entries(browserMix[device]) as [Browser, number][]) {
          const r = rng(`${partner.id}|${date}|${device}|${browser}`);
          const started = Math.round(volume * profile.deviceMix[device] * share * r.wobble(0.12));
          if (started === 0) continue;

          const failures = {} as Record<FailureReason, number>;
          let failed = 0;
          for (const reason of Object.keys(failureMix) as FailureReason[]) {
            const rate =
              FAILURE_RATE *
              failureMix[reason] *
              failureMultiplier(partner.id, date, device, reason) *
              r.wobble(0.2);
            failures[reason] = Math.round(started * rate);
            failed += failures[reason];
          }
          const abandoned = Math.round(started * ABANDON_RATE * r.wobble(0.25));
          const analyzed = Math.max(0, started - failed - abandoned);
          // Camera denials and most abandons happen before a selfie exists.
          const beforeSelfie = failures.camera_blocked + Math.round(abandoned * 0.6);
          const selfie = Math.max(analyzed, started - beforeSelfie);
          const recommended = Math.round(analyzed * (0.97 * r.wobble(0.01)));
          const clickRate = profile.clickRate * (device === "Desktop" ? 1.12 : 1) * r.wobble(0.1);
          const clicked = Math.round(recommended * clickRate);
          const purchased = Math.round(clicked * profile.buyRate * r.wobble(0.15));

          rows.push({
            date,
            partnerId: partner.id,
            device,
            browser,
            started,
            selfie,
            analyzed,
            recommended,
            clicked,
            purchased,
            failures,
          });
        }
      }
    }
  }
  return rows;
}

export function generateLatency(): LatencyInput[] {
  const rows: LatencyInput[] = [];
  for (const partner of partners) {
    for (const date of allDates) {
      if (!isLive(partner, date)) continue;
      for (const step of Object.keys(latencyBaseline) as LatencyStep[]) {
        const r = rng(`latency|${partner.id}|${date}|${step}`);
        const base = latencyBaseline[step];
        const mod = latencyModifier[partner.id as PartnerKey]?.[step] ?? 1;
        const day = weekday(date);
        const quiet = day === 0 || day === 6 ? 0.94 : 1;
        let p50 = base.p50 * mod * quiet * r.wobble(0.05);
        let p95 = base.p95 * mod * quiet * r.wobble(0.07);
        let p99 = base.p99 * mod * quiet * r.wobble(0.09);
        const incident = incidentFor(partner.id, date, step);
        if (incident && incident.durationMin > 0) {
          p99 = incident.peakP99Ms;
          p95 = incident.peakP99Ms * 0.62;
          p50 *= 1.45;
        }
        rows.push({
          date,
          partnerId: partner.id,
          step,
          p50: Math.round(p50),
          p95: Math.round(Math.max(p50, p95)),
          p99: Math.round(Math.max(p95, p99)),
        });
      }
    }
  }
  return rows;
}

export function generateConcerns(daily: DailyStat[]): ConcernInput[] {
  const analyzedByKey = new Map<string, number>();
  for (const row of daily) {
    const key = `${row.partnerId}|${row.date}`;
    analyzedByKey.set(key, (analyzedByKey.get(key) ?? 0) + row.analyzed);
  }
  const rows: ConcernInput[] = [];
  for (const partner of partners) {
    const profile = profileOf(partner);
    for (const date of allDates) {
      const analyzed = analyzedByKey.get(`${partner.id}|${date}`);
      if (analyzed === undefined) continue;
      const r = rng(`concerns|${partner.id}|${date}`);
      const shares =
        partner.id === "prt_sakura" && date >= SAKURA_MODEL_ROLLOUT
          ? { ...profile.concerns, ...sakuraAfterRollout }
          : profile.concerns;
      const concerns = {} as Record<Concern, number>;
      for (const [concern, share] of Object.entries(shares) as [Concern, number][]) {
        concerns[concern] = Math.round(analyzed * share * r.wobble(0.05));
      }
      rows.push({ date, partnerId: partner.id, analyzed, concerns });
    }
  }
  return rows;
}

// Products that were out of stock for part of the window, and how many days.
const stockOutages: Partial<Record<string, number>> = {
  sku_hs_retinol_03: 6,
  sku_nb_spf50_fluid: 3,
  sku_ss_brightening: 4,
};

export function generateProductStats(daily: DailyStat[]): ProductStatInput[] {
  const recommendedByPartner = new Map<PartnerId, number>();
  for (const row of daily) {
    recommendedByPartner.set(
      row.partnerId,
      (recommendedByPartner.get(row.partnerId) ?? 0) + row.recommended,
    );
  }
  return products.map((product) => {
    const r = rng(`product|${product.id}`);
    const sessions = recommendedByPartner.get(product.partnerId) ?? 0;
    // Three slots per session over six products, with uneven popularity.
    const served = Math.round(sessions * 0.5 * r.wobble(0.35));
    const outOfStockDays = stockOutages[product.id] ?? 0;
    const availability = 1 - (outOfStockDays / DATA_DAYS) * 0.85;
    const clickRate = (0.09 + r.next() * 0.12) * availability;
    const clicked = Math.round(served * clickRate);
    const purchased = Math.round(clicked * (0.08 + r.next() * 0.06));
    return {
      productId: product.id,
      partnerId: product.partnerId,
      served,
      clicked,
      purchased,
      avgMatch: Math.round((62 + r.next() * 26) * 10) / 10,
      outOfStockDays,
    };
  });
}

const outcomeMix: Record<Outcome, number> = {
  failed: 0.19,
  abandoned: 0.09,
  recommended: 0.46,
  clicked: 0.17,
  purchased: 0.09,
};

function sessionId(r: ReturnType<typeof rng>): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) id += alphabet[r.int(0, alphabet.length - 1)];
  return `ses_${id}`;
}

/** A sample of individual sessions for the explorer: 70 per partner inside its live window. */
export function generateSessions(): SessionInput[] {
  const rows: SessionInput[] = [];
  for (const partner of partners) {
    const profile = profileOf(partner);
    const liveDates = allDates.filter((d) => isLive(partner, d));
    const catalog = products.filter((p) => p.partnerId === partner.id);
    for (let i = 0; i < 70; i++) {
      const r = rng(`session|${partner.id}|${i}`);
      const date = r.pick(liveDates);
      const hour = r.int(7, 22);
      const minute = r.int(0, 59);
      const second = r.int(0, 59);
      const device = r.weighted(profile.deviceMix);
      const browser = r.weighted(browserMix[device] as Record<Browser, number>);
      const outcome = r.weighted(outcomeMix);
      const failureReason = outcome === "failed" ? r.weighted(failureMix) : null;
      const analyzed = outcome !== "failed" && outcome !== "abandoned";
      const incident = incidentFor(partner.id, date, "analysis");
      const slow = incident !== undefined && incident.durationMin > 0;

      let analysis: SessionInput["analysis"] = null;
      let recommendations: SessionInput["recommendations"] = [];
      if (analyzed) {
        const shares =
          partner.id === "prt_sakura" && date >= SAKURA_MODEL_ROLLOUT
            ? { ...profile.concerns, ...sakuraAfterRollout }
            : profile.concerns;
        const found = (Object.entries(shares) as [Concern, number][])
          .filter(([, share]) => r.next() < share)
          .slice(0, 4)
          .map(([concern]) => ({ concern, score: r.int(38, 92) }))
          .sort((a, b) => b.score - a.score);
        if (found.length === 0) found.push({ concern: r.weighted(shares), score: r.int(45, 80) });
        analysis = {
          lightingScore: r.int(48, 97),
          confidence: r.int(58, 97),
          concerns: found,
        };
        const flagged = new Set(found.map((c) => c.concern));
        recommendations = [...catalog]
          .map((p) => ({
            product: p,
            overlap: p.targets.filter((t) => flagged.has(t)).length,
            tiebreak: r.next(),
          }))
          .sort((a, b) => b.overlap - a.overlap || b.tiebreak - a.tiebreak)
          .slice(0, 3)
          .map((entry, rank) => ({
            productId: entry.product.id,
            matchScore: Math.min(97, Math.max(52, 92 - rank * 7 - r.int(0, 8) + entry.overlap * 2)),
          }));
      }

      const durationMs =
        outcome === "failed"
          ? r.int(6_000, 38_000)
          : outcome === "abandoned"
            ? r.int(4_000, 22_000)
            : r.int(45_000, 190_000);
      const startedAt = `${date}T${pad(hour)}:${pad(minute)}:${pad(second)}.000Z`;
      rows.push({
        id: sessionId(r),
        partnerId: partner.id,
        startedAt,
        device,
        browser,
        skinTone: r.weighted(profile.skinToneMix),
        durationMs,
        outcome,
        failureReason,
        analysisMs:
          analyzed || failureReason === "timeout" || failureReason === "low_confidence"
            ? Math.round(
                r.around(slow ? 2600 : 780, slow ? 1800 : 320) +
                  (failureReason === "timeout" ? 6000 : 0),
              )
            : null,
        recommendMs: analyzed ? Math.round(r.around(190, 90)) : null,
        analysis,
        recommendations,
      });
    }
  }
  return rows.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
