import { Effect, Result } from "effect";
import { describe, expect, it } from "vitest";
import { DATA_END } from "@/data/generate";
import { concernDays } from "@/data/store";
import { PartnerId } from "@/lib/ids";
import { type ConcernDaily, concernLabel } from "@/schemas/session";
import { ConcernRepo, DRIFT_THRESHOLD_PP, detectDrift, driftErrorMessage } from "./drift";

const sakura = PartnerId.parse("prt_sakura");
const nordbeauty = PartnerId.parse("prt_nordbeauty");
const coastline = PartnerId.parse("prt_coastline");

function withRepo(days: ConcernDaily[]) {
  return Effect.provideService(ConcernRepo, {
    days: (partner) => days.filter((d) => partner === "all" || d.partnerId === partner),
  });
}

function run<A, E>(effect: Effect.Effect<A, E, ConcernRepo>, days = concernDays) {
  return Effect.runPromise(effect.pipe(withRepo(days), Effect.result));
}

describe("detectDrift", () => {
  it("flags the redness jump after the Sakura Skin model rollout", async () => {
    const result = await run(detectDrift(sakura, DATA_END));
    expect(Result.isSuccess(result)).toBe(true);
    if (!Result.isSuccess(result)) return;
    const report = result.success;
    expect(report.current).toEqual(
      expect.objectContaining({ from: "2026-10-01", to: "2026-10-07" }),
    );
    expect(report.previous).toEqual(
      expect.objectContaining({ from: "2026-09-24", to: "2026-09-30" }),
    );
    expect(report.flagged[0]?.concern).toBe("redness");
    expect(report.flagged[0]?.deltaPp).toBeGreaterThan(5);
    expect(report.flagged.map((s) => s.concern)).toContain("dark_spots");
    expect(concernLabel[report.flagged[0]?.concern ?? "redness"]).toBe("Redness");
  });

  it("stays quiet for a partner with a stable distribution", async () => {
    const result = await run(detectDrift(nordbeauty, DATA_END));
    expect(Result.isSuccess(result)).toBe(true);
    if (!Result.isSuccess(result)) return;
    expect(result.success.flagged).toHaveLength(0);
    for (const shift of result.success.shifts) {
      expect(Math.abs(shift.deltaPp)).toBeLessThan(DRIFT_THRESHOLD_PP);
    }
  });

  it("refuses to compare when the previous week is too thin", async () => {
    // Coastline Drug went live on 2026-09-29: only two ramp-up days in the previous week.
    const result = await run(detectDrift(coastline, DATA_END));
    expect(Result.isFailure(result)).toBe(true);
    if (!Result.isFailure(result)) return;
    expect(result.failure._tag).toBe("InsufficientSamples");
    if (result.failure._tag === "InsufficientSamples") {
      expect(result.failure.week).toBe("previous");
      expect(driftErrorMessage(result.failure)).toMatch(
        /previous week has [\d,]+ analyzed sessions/,
      );
    }
  });

  it("fails with NoConcernData when the scope has no rows", async () => {
    const result = await run(detectDrift(sakura, DATA_END), []);
    expect(Result.isFailure(result) && result.failure._tag).toBe("NoConcernData");
  });
});
