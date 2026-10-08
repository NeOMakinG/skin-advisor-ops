import { z } from "zod";
import { PartnerId, ProductId } from "@/lib/ids";
import { Concern } from "@/schemas/session";

export const ProductCategory = z.enum([
  "serum",
  "moisturizer",
  "cleanser",
  "sunscreen",
  "treatment",
  "toner",
]);
export type ProductCategory = z.infer<typeof ProductCategory>;

export const Product = z.object({
  id: ProductId,
  partnerId: PartnerId,
  name: z.string().min(2).max(60),
  category: ProductCategory,
  // Major units of the partner currency.
  price: z.number().positive(),
  targets: z.array(Concern).min(1).max(3),
});
export type Product = z.infer<typeof Product>;

// 28-day recommendation performance per product, aggregated from served recommendations.
export const ProductStat = z
  .object({
    productId: ProductId,
    partnerId: PartnerId,
    served: z.number().int().nonnegative(),
    clicked: z.number().int().nonnegative(),
    purchased: z.number().int().nonnegative(),
    avgMatch: z.number().min(0).max(100),
    outOfStockDays: z.number().int().min(0).max(28),
  })
  .refine((s) => s.served >= s.clicked && s.clicked >= s.purchased, {
    message: "served >= clicked >= purchased",
  });
export type ProductStat = z.infer<typeof ProductStat>;
