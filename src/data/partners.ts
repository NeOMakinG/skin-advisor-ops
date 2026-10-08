import { z } from "zod";
import { Partner } from "@/schemas/partner";

// Fictional deployments. Coastline Drug went live nine days before the data ends, so its
// week-over-week comparisons do not have enough history yet.
export const partners = z.array(Partner).parse([
  {
    id: "prt_nordbeauty",
    name: "Nordbeauty",
    country: "DK",
    currency: "DKK",
    channel: "web",
    launchedAt: "2025-02-11",
    baselineConversion: 0.011,
  },
  {
    id: "prt_highstreet",
    name: "Highstreet Pharmacy",
    country: "GB",
    currency: "GBP",
    channel: "app",
    launchedAt: "2024-10-03",
    baselineConversion: 0.013,
  },
  {
    id: "prt_sakura",
    name: "Sakura Skin",
    country: "ID",
    currency: "IDR",
    channel: "web",
    launchedAt: "2025-06-24",
    baselineConversion: 0.007,
  },
  {
    id: "prt_coastline",
    name: "Coastline Drug",
    country: "US",
    currency: "USD",
    channel: "web",
    launchedAt: "2026-09-29",
    baselineConversion: 0.009,
  },
]);

export function partnerById(id: string) {
  return partners.find((p) => p.id === id);
}
