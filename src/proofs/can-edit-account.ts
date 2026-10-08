import { defineProof, type Named, type Proof } from "@gdp-ts/core";
import { accountStore, userStore } from "@/data/account-store";
import type { AccountId, UserId } from "@/lib/ids";
import type { Account } from "@/schemas/account";
import type { User } from "@/schemas/user";

// Trusted module: the prover stays private, so this file is the only place that
// can produce a CanEditAccount proof. Sensitive functions demand it by type.
const CanEditAccount = defineProof("CanEditAccount");
export interface CanEditAccount<U, A> extends Proof<"CanEditAccount", [U, A]> {}

export function canEditAccount<U, A>(
  user: Named<U, UserId>,
  account: Named<A, AccountId>,
): CanEditAccount<U, A> | null {
  const viewer = userStore.byId(user.value);
  const target = accountStore.byId(account.value);
  if (!viewer || !target) return null;
  return isEditor(viewer, target) ? CanEditAccount.prove(user, account) : null;
}

function isEditor(viewer: User, account: Account) {
  return viewer.role === "admin" || account.ownerId === viewer.id;
}

// Plain boolean for UI hints (disable a button). It can never stand in for the proof.
export function editAccessHint(viewer: User, account: Account): string | null {
  return isEditor(viewer, account)
    ? null
    : "Only admins or the account owner can edit this account.";
}
