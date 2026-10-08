import { accountsRouter } from "@/server/routers/accounts";
import { router } from "@/server/trpc";

export const appRouter = router({
  accounts: accountsRouter,
});

export type AppRouter = typeof appRouter;
