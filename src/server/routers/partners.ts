import { DATA_END } from "@/data/generate";
import { partners } from "@/data/partners";
import { publicProcedure, router } from "@/server/trpc";

export const partnersRouter = router({
  list: publicProcedure.query(() => ({ partners, dataThrough: DATA_END })),
});
