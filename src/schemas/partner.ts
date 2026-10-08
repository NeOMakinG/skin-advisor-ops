import { z } from "zod";
import { PartnerId } from "@/lib/ids";

export const Country = z.enum(["DK", "GB", "ID", "US"]);
export type Country = z.infer<typeof Country>;

export const Currency = z.enum(["DKK", "GBP", "IDR", "USD"]);
export type Currency = z.infer<typeof Currency>;

export const Channel = z.enum(["web", "app", "in-store"]);
export type Channel = z.infer<typeof Channel>;

export const Partner = z.object({
  id: PartnerId,
  name: z.string().min(2).max(60),
  country: Country,
  currency: Currency,
  channel: Channel,
  launchedAt: z.iso.date(),
  // Share of partner site visitors who buy without the advisor. Uplift is measured against it.
  baselineConversion: z.number().positive().max(0.2),
});
export type Partner = z.infer<typeof Partner>;

export const countryName: Record<Country, string> = {
  DK: "Denmark",
  GB: "United Kingdom",
  ID: "Indonesia",
  US: "United States",
};
