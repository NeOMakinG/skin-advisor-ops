import { Effect, Result } from "effect";
import { describe, expect, it } from "vitest";
import { accounts } from "@/data/accounts";
import { AccountId } from "@/lib/ids";
import type { Account } from "@/schemas/account";
import { AccountRepo, applyAccountPatch } from "./account-rules";

const fuel = accounts.find((a) => a.id === "acc_003") as Account; // credit, balance 23480.10
const legacy = accounts.find((a) => a.id === "acc_007") as Account; // closed

const withFakeRepo = Effect.provideService(AccountRepo, {
  byId: (id) => accounts.find((a) => a.id === id),
  byName: (name) => accounts.find((a) => a.name.toLowerCase() === name.toLowerCase()),
});

function run<A, E>(effect: Effect.Effect<A, E, AccountRepo>) {
  return Effect.runPromise(effect.pipe(withFakeRepo, Effect.result));
}

describe("applyAccountPatch", () => {
  it("renames an account and keeps the limit for credit accounts", async () => {
    const result = await run(
      applyAccountPatch(fuel.id, { name: "Fleet Cards", creditLimit: 60_000 }),
    );
    expect(Result.isSuccess(result)).toBe(true);
    if (Result.isSuccess(result)) {
      expect(result.success.name).toBe("Fleet Cards");
      expect(result.success.creditLimit).toBe(60_000);
    }
  });

  it("fails with AccountNotFound for an unknown id", async () => {
    const result = await run(
      applyAccountPatch(AccountId.parse("acc_999"), { name: "Ghost", creditLimit: null }),
    );
    expect(Result.isFailure(result) && result.failure._tag).toBe("AccountNotFound");
  });

  it("refuses to edit a closed account", async () => {
    const result = await run(applyAccountPatch(legacy.id, { name: "Renamed", creditLimit: null }));
    expect(Result.isFailure(result) && result.failure._tag).toBe("AccountClosed");
  });

  it("refuses a credit limit below the amount owed", async () => {
    const result = await run(applyAccountPatch(fuel.id, { name: fuel.name, creditLimit: 1_000 }));
    expect(Result.isFailure(result) && result.failure._tag).toBe("CreditLimitBelowBalance");
  });

  it("refuses a name that another account already uses", async () => {
    const result = await run(
      applyAccountPatch(fuel.id, { name: "harbor reserve", creditLimit: 50_000 }),
    );
    expect(Result.isFailure(result) && result.failure._tag).toBe("DuplicateAccountName");
  });
});
