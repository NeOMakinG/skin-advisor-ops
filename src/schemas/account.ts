import { z } from "zod";
import { AccountId, UserId } from "@/lib/ids";

export const Currency = z.enum(["USD", "EUR", "GBP"]);
export type Currency = z.infer<typeof Currency>;

export const AccountType = z.enum(["checking", "savings", "credit"]);
export type AccountType = z.infer<typeof AccountType>;

export const AccountStatus = z.enum(["active", "frozen", "closed"]);
export type AccountStatus = z.infer<typeof AccountStatus>;

export const BalancePoint = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  balance: z.number(),
});
export type BalancePoint = z.infer<typeof BalancePoint>;

export const Account = z.object({
  id: AccountId,
  name: z.string().min(2).max(60),
  ownerId: UserId,
  type: AccountType,
  status: AccountStatus,
  currency: Currency,
  balance: z.number(),
  // Only credit accounts have a limit; the balance of a credit account is the amount owed.
  creditLimit: z.number().positive().nullable(),
  openedAt: z.iso.date(),
  history: z.array(BalancePoint).min(1),
});
export type Account = z.infer<typeof Account>;

export const AccountPatch = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name needs at least 2 characters")
    .max(60, "Keep it under 60 characters"),
  creditLimit: z.number().positive("Limit must be above zero").nullable(),
});
export type AccountPatch = z.infer<typeof AccountPatch>;

export const UpdateAccountInput = z.object({
  accountId: AccountId,
  patch: AccountPatch,
});
export type UpdateAccountInput = z.infer<typeof UpdateAccountInput>;
