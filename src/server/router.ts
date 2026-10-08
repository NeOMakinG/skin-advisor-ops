import { metricsRouter } from "@/server/routers/metrics";
import { partnersRouter } from "@/server/routers/partners";
import { sessionsRouter } from "@/server/routers/sessions";
import { router } from "@/server/trpc";

export const appRouter = router({
  partners: partnersRouter,
  metrics: metricsRouter,
  sessions: sessionsRouter,
});

export type AppRouter = typeof appRouter;
