import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, unstable_localLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { session } from "@/lib/session";
import { createContext } from "@/server/context";
import { type AppRouter, appRouter } from "@/server/router";

// The tRPC router runs inside the browser: no server, works on GitHub Pages.
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    unstable_localLink({
      router: appRouter,
      createContext: () => createContext(session.viewerId),
    }),
  ],
});

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: false } },
});

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
