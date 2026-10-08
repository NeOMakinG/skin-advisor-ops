import type { Named } from "@gdp-ts/core";
import { accounts as seed } from "@/data/accounts";
import { users } from "@/data/users";
import type { AccountId, UserId } from "@/lib/ids";
import type { CanEditAccount } from "@/proofs/can-edit-account";
import type { Account } from "@/schemas/account";
import type { User } from "@/schemas/user";

// In-memory "database" for the static prototype. Reads are open; writes demand a proof.
const table = new Map<AccountId, Account>(seed.map((a) => [a.id, a]));

export const accountStore = {
  list(): Account[] {
    return [...table.values()];
  },
  byId(id: AccountId): Account | undefined {
    return table.get(id);
  },
  byName(name: string): Account | undefined {
    const needle = name.trim().toLowerCase();
    return this.list().find((a) => a.name.toLowerCase() === needle);
  },
  // Sensitive: compiles only with a CanEditAccount proof about this exact account.
  write<U, A>(account: Named<A, AccountId>, next: Account, _proof: CanEditAccount<U, A>): Account {
    table.set(account.value, next);
    return next;
  },
};

export const userStore = {
  byId(id: UserId): User | undefined {
    return users.find((u) => u.id === id);
  },
};
