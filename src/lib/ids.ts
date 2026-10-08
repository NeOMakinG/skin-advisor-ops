import { z } from "zod";

// Branded ids: a PartnerId can never be passed where a SessionId is expected.
export const PartnerId = z
  .string()
  .regex(/^prt_[a-z]+$/)
  .brand<"PartnerId">();
export type PartnerId = z.infer<typeof PartnerId>;

export const ProductId = z
  .string()
  .regex(/^sku_[a-z0-9_]+$/)
  .brand<"ProductId">();
export type ProductId = z.infer<typeof ProductId>;

export const SessionId = z
  .string()
  .regex(/^ses_[a-z0-9]{6}$/)
  .brand<"SessionId">();
export type SessionId = z.infer<typeof SessionId>;

export const IncidentId = z
  .string()
  .regex(/^inc_\d{3}$/)
  .brand<"IncidentId">();
export type IncidentId = z.infer<typeof IncidentId>;
