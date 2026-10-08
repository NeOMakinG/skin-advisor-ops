import { z } from "zod";
import { IncidentId, PartnerId, ProductId, SessionId } from "@/lib/ids";

export const Device = z.enum(["iPhone 15", "Galaxy S24", "Pixel 8", "Desktop"]);
export type Device = z.infer<typeof Device>;

export const Browser = z.enum(["Safari", "Chrome", "Samsung Internet", "Edge", "Firefox"]);
export type Browser = z.infer<typeof Browser>;

export const FailureReason = z.enum([
  "face_not_detected",
  "low_light",
  "camera_blocked",
  "timeout",
  "low_confidence",
  "other",
]);
export type FailureReason = z.infer<typeof FailureReason>;

export const failureLabel: Record<FailureReason, string> = {
  face_not_detected: "Face not detected",
  low_light: "Poor lighting",
  camera_blocked: "Camera permission denied",
  timeout: "Analysis timeout",
  low_confidence: "Low confidence",
  other: "Other",
};

export const Concern = z.enum([
  "dryness",
  "oiliness",
  "redness",
  "dark_spots",
  "wrinkles",
  "acne",
  "dark_circles",
  "uneven_tone",
]);
export type Concern = z.infer<typeof Concern>;

export const concernLabel: Record<Concern, string> = {
  dryness: "Dryness",
  oiliness: "Oiliness",
  redness: "Redness",
  dark_spots: "Dark spots",
  wrinkles: "Fine lines",
  acne: "Blemishes",
  dark_circles: "Dark circles",
  uneven_tone: "Uneven tone",
};

// Six-bucket skin tone scale, labelled 1 (lightest) to 6 (deepest).
export const SkinTone = z.enum(["1", "2", "3", "4", "5", "6"]);
export type SkinTone = z.infer<typeof SkinTone>;

export const Stage = z.enum([
  "started",
  "selfie",
  "analyzed",
  "recommended",
  "clicked",
  "purchased",
]);
export type Stage = z.infer<typeof Stage>;

export const stageLabel: Record<Stage, string> = {
  started: "Started",
  selfie: "Selfie captured",
  analyzed: "Analyzed",
  recommended: "Recommended",
  clicked: "Product clicked",
  purchased: "Purchased",
};

export const Outcome = z.enum(["purchased", "clicked", "recommended", "abandoned", "failed"]);
export type Outcome = z.infer<typeof Outcome>;

export const outcomeLabel: Record<Outcome, string> = {
  purchased: "Purchased",
  clicked: "Clicked",
  recommended: "Recommended",
  abandoned: "Abandoned",
  failed: "Failed",
};

export const LatencyStep = z.enum(["upload", "analysis", "recommend"]);
export type LatencyStep = z.infer<typeof LatencyStep>;

export const stepLabel: Record<LatencyStep, string> = {
  upload: "Selfie upload",
  analysis: "Skin analysis",
  recommend: "Recommendation",
};

const Count = z.number().int().nonnegative();
const IsoDate = z.iso.date();

// One row per partner, day, device and browser. Counts are sessions reaching each stage.
export const DailyStat = z
  .object({
    date: IsoDate,
    partnerId: PartnerId,
    device: Device,
    browser: Browser,
    started: Count,
    selfie: Count,
    analyzed: Count,
    recommended: Count,
    clicked: Count,
    purchased: Count,
    failures: z.record(FailureReason, Count),
  })
  .refine(
    (r) =>
      r.started >= r.selfie &&
      r.selfie >= r.analyzed &&
      r.analyzed >= r.recommended &&
      r.recommended >= r.clicked &&
      r.clicked >= r.purchased,
    { message: "Funnel stages must be monotonic" },
  )
  // Sessions that never reached analysis either failed (with a reason) or were abandoned.
  .refine((r) => Object.values(r.failures).reduce((a, b) => a + b, 0) <= r.started - r.analyzed, {
    message: "Failures cannot exceed the sessions that did not reach analysis",
  });
export type DailyStat = z.infer<typeof DailyStat>;

const Millis = z.number().int().nonnegative();

export const LatencyPoint = z
  .object({
    date: IsoDate,
    partnerId: PartnerId,
    step: LatencyStep,
    p50: Millis,
    p95: Millis,
    p99: Millis,
  })
  .refine((p) => p.p50 <= p.p95 && p.p95 <= p.p99, { message: "Percentiles must be ordered" });
export type LatencyPoint = z.infer<typeof LatencyPoint>;

// Detected concerns per partner and day. A session can carry several concerns, so the
// counts do not sum to `analyzed`; share = count / analyzed.
export const ConcernDaily = z.object({
  date: IsoDate,
  partnerId: PartnerId,
  analyzed: Count,
  concerns: z.record(Concern, Count),
});
export type ConcernDaily = z.infer<typeof ConcernDaily>;

export const Incident = z.object({
  id: IncidentId,
  partnerId: PartnerId.nullable(),
  date: IsoDate,
  step: LatencyStep,
  title: z.string().min(4).max(80),
  summary: z.string().min(10).max(240),
  peakP99Ms: Millis,
  durationMin: z.number().int().nonnegative(),
  status: z.enum(["resolved", "monitoring"]),
});
export type Incident = z.infer<typeof Incident>;

export const ConcernScore = z.object({ concern: Concern, score: z.number().min(0).max(100) });
export type ConcernScore = z.infer<typeof ConcernScore>;

export const Analysis = z.object({
  lightingScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  concerns: z.array(ConcernScore).min(1).max(4),
});
export type Analysis = z.infer<typeof Analysis>;

export const Recommendation = z.object({
  productId: ProductId,
  matchScore: z.number().int().min(0).max(100),
});
export type Recommendation = z.infer<typeof Recommendation>;

export const Session = z
  .object({
    id: SessionId,
    partnerId: PartnerId,
    startedAt: z.iso.datetime(),
    device: Device,
    browser: Browser,
    skinTone: SkinTone,
    durationMs: Millis,
    outcome: Outcome,
    failureReason: FailureReason.nullable(),
    analysisMs: Millis.nullable(),
    recommendMs: Millis.nullable(),
    analysis: Analysis.nullable(),
    recommendations: z.array(Recommendation).max(4),
  })
  .refine((s) => (s.outcome === "failed") === (s.failureReason !== null), {
    message: "Failed sessions carry a reason, others do not",
  })
  .refine((s) => (s.outcome === "failed" || s.outcome === "abandoned") === (s.analysis === null), {
    message: "Only analyzed sessions carry an analysis result",
  });
export type Session = z.infer<typeof Session>;
