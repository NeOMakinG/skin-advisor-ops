import { z } from "zod";
import { PartnerId } from "@/lib/ids";

// Every screen is scoped by partner and time range. The scope lives in the URL search params.
export const PartnerScope = z.union([z.literal("all"), PartnerId]);
export type PartnerScope = z.infer<typeof PartnerScope>;

export const RangeDays = z.union([z.literal(7), z.literal(14), z.literal(28)]);
export type RangeDays = z.infer<typeof RangeDays>;

export const Scope = z.object({
  partner: PartnerScope.default("all"),
  range: RangeDays.default(28),
});
export type Scope = z.infer<typeof Scope>;
