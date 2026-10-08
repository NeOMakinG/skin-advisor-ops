import { z } from "zod";

// Branded ids: an AccountId can never be passed where a UserId is expected.
export const AccountId = z
  .string()
  .regex(/^acc_\d{3}$/)
  .brand<"AccountId">();
export type AccountId = z.infer<typeof AccountId>;

export const UserId = z
  .string()
  .regex(/^usr_\d{3}$/)
  .brand<"UserId">();
export type UserId = z.infer<typeof UserId>;
