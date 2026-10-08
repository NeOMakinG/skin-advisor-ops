import { z } from "zod";
import { Incident } from "@/schemas/session";

// Incidents are the source of truth for latency spikes: the generator reads them to shape
// the percentile series and the timeout counts for the affected day.
export const incidents = z.array(Incident).parse([
  {
    id: "inc_014",
    partnerId: null,
    date: "2026-09-18",
    step: "analysis",
    title: "Analysis workers saturated",
    summary:
      "A batch re-score job shared the analysis pool with live traffic. Autoscaling lagged 40 minutes and timeouts tripled across every partner.",
    peakP99Ms: 9800,
    durationMin: 95,
    status: "resolved",
  },
  {
    id: "inc_015",
    partnerId: "prt_sakura",
    date: "2026-09-25",
    step: "upload",
    title: "Jakarta edge rejected multipart uploads",
    summary:
      "One CDN edge returned 5xx on selfie uploads above 2 MB. Mobile sessions in Indonesia retried up to three times before failing.",
    peakP99Ms: 7100,
    durationMin: 55,
    status: "resolved",
  },
  {
    id: "inc_016",
    partnerId: "prt_highstreet",
    date: "2026-10-02",
    step: "recommend",
    title: "Catalog sync locked the recommendation index",
    summary:
      "A nightly catalog import held a write lock during the UK morning peak. Recommendations queued behind it and p95 passed 3 seconds.",
    peakP99Ms: 5200,
    durationMin: 70,
    status: "resolved",
  },
  {
    id: "inc_017",
    partnerId: "prt_sakura",
    date: "2026-09-30",
    step: "analysis",
    title: "Concern model 2.3 rollout",
    summary:
      "Model 2.3 shipped to Sakura Skin first. Latency is unchanged, but redness detections rose sharply afterwards. Under review as a possible calibration regression on deeper skin tones.",
    peakP99Ms: 3900,
    durationMin: 0,
    status: "monitoring",
  },
]);
