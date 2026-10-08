import { Context, Data, Effect } from "effect";
import type { AccountId } from "@/lib/ids";
import { formatMoney } from "@/lib/utils";
import type { Account, AccountPatch } from "@/schemas/account";

// Typed failures: each one maps to a distinct user-facing outcome at the tRPC boundary.
export class AccountNotFound extends Data.TaggedError("AccountNotFound")<{
  readonly accountId: AccountId;
}> {}

export class AccountClosed extends Data.TaggedError("AccountClosed")<{
  readonly accountId: AccountId;
}> {}

export class CreditLimitBelowBalance extends Data.TaggedError("CreditLimitBelowBalance")<{
  readonly balance: number;
  readonly creditLimit: number;
  readonly currency: string;
}> {}

export class DuplicateAccountName extends Data.TaggedError("DuplicateAccountName")<{
  readonly name: string;
}> {}

export type AccountRuleError =
  | AccountNotFound
  | AccountClosed
  | CreditLimitBelowBalance
  | DuplicateAccountName;

// The repository is a service so the rules can be tested against an in-memory fake.
export class AccountRepo extends Context.Service<
  AccountRepo,
  {
    readonly byId: (id: AccountId) => Account | undefined;
    readonly byName: (name: string) => Account | undefined;
  }
>()("AccountRepo") {}

/** Computes the updated account, or fails with a typed error. Does not write anything. */
export const applyAccountPatch = Effect.fn("applyAccountPatch")(function* (
  accountId: AccountId,
  patch: AccountPatch,
) {
  const repo = yield* AccountRepo;
  const current = repo.byId(accountId);
  if (!current) return yield* new AccountNotFound({ accountId });
  if (current.status === "closed") return yield* new AccountClosed({ accountId });

  const clash = repo.byName(patch.name);
  if (clash && clash.id !== current.id) {
    return yield* new DuplicateAccountName({ name: patch.name });
  }

  const creditLimit = current.type === "credit" ? patch.creditLimit : null;
  if (creditLimit !== null && creditLimit < current.balance) {
    return yield* new CreditLimitBelowBalance({
      balance: current.balance,
      creditLimit,
      currency: current.currency,
    });
  }

  return { ...current, name: patch.name, creditLimit } satisfies Account;
});

export function accountRuleMessage(error: AccountRuleError): string {
  switch (error._tag) {
    case "AccountNotFound":
      return `Account ${error.accountId} does not exist.`;
    case "AccountClosed":
      return "Closed accounts cannot be edited.";
    case "CreditLimitBelowBalance":
      return `The limit (${formatMoney(error.creditLimit, error.currency)}) cannot be below the amount owed (${formatMoney(error.balance, error.currency)}).`;
    case "DuplicateAccountName":
      return `An account named "${error.name}" already exists.`;
  }
}
