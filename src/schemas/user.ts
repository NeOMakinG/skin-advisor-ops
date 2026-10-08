import { z } from "zod";
import { UserId } from "@/lib/ids";

export const Role = z.enum(["admin", "analyst"]);
export type Role = z.infer<typeof Role>;

export const User = z.object({
  id: UserId,
  name: z.string().min(1),
  role: Role,
});
export type User = z.infer<typeof User>;
