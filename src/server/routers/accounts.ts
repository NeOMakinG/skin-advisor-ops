import { name } from "@gdp-ts/core";
import { TRPCError } from "@trpc/server";
import { Effect, Result } from "effect";
import { z } from "zod";
import { accountStore } from "@/data/account-store";
import {
  AccountRepo,
  type AccountRuleError,
  accountRuleMessage,
  applyAccountPatch,
} from "@/domain/account-rules";
import { AccountId } from "@/lib/ids";
import { canEditAccount } from "@/proofs/can-edit-account";
import { UpdateAccountInput } from "@/schemas/account";
import { publicProcedure, router } from "@/server/trpc";

const repoLayer = Effect.provideService(AccountRepo, {
  byId: (id) => accountStore.byId(id),
  byName: (n) => accountStore.byName(n),
});

function toTRPCError(error: AccountRuleError): TRPCError {
  const message = accountRuleMessage(error);
  switch (error._tag) {
    case "AccountNotFound":
      return new TRPCError({ code: "NOT_FOUND", message });
    case "AccountClosed":
    case "CreditLimitBelowBalance":
      return new TRPCError({ code: "PRECONDITION_FAILED", message });
    case "DuplicateAccountName":
      return new TRPCError({ code: "CONFLICT", message });
  }
}

export const accountsRouter = router({
  list: publicProcedure.query(() =>
    accountStore.list().sort((a, b) => a.name.localeCompare(b.name)),
  ),

  byId: publicProcedure.input(z.object({ accountId: AccountId })).query(({ input }) => {
    const account = accountStore.byId(input.accountId);
    if (!account) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `There is no account with id ${input.accountId}.`,
      });
    }
    return account;
  }),

  // Authorization (gdp-ts proof) + domain rules (Effect) + write, in one place.
  update: publicProcedure.input(UpdateAccountInput).mutation(({ ctx, input }) =>
    name(ctx.viewer.id, input.accountId, async (user, account) => {
      const proof = canEditAccount(user, account);
      if (!proof) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot edit this account." });
      }
      const result = await Effect.runPromise(
        applyAccountPatch(account.value, input.patch).pipe(repoLayer, Effect.result),
      );
      if (Result.isFailure(result)) throw toTRPCError(result.failure);
      return accountStore.write(account, result.success, proof);
    }),
  ),
});
