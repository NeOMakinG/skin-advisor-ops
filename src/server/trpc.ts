import { initTRPC } from "@trpc/server";
import type { Context } from "@/server/context";

// allowOutsideOfServer: the router runs in the browser behind unstable_localLink.
const t = initTRPC.context<Context>().create({ allowOutsideOfServer: true });

export const router = t.router;
export const publicProcedure = t.procedure;
