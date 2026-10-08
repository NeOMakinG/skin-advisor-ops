import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/app.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient, TRPCProvider, trpcClient } from "@/lib/trpc";
import { router } from "@/router";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root element");

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </TRPCProvider>
    </QueryClientProvider>
  </StrictMode>,
);
