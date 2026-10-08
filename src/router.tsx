import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { FailuresPage } from "@/routes/failures";
import { LatencyPage } from "@/routes/latency";
import { NotFoundPage } from "@/routes/not-found";
import { OverviewPage } from "@/routes/overview";
import { SessionsPage } from "@/routes/sessions";
import { Scope } from "@/schemas/scope";

// Code-based routes (no codegen). Hash history keeps deep links working on GitHub Pages.
// The root route validates the shared scope (partner, range) so every child reads it.
export const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: NotFoundPage,
  validateSearch: Scope,
});

export const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: OverviewPage,
});

export const failuresRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/failures",
  component: FailuresPage,
});

export const latencyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/latency",
  component: LatencyPage,
});

export const sessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions",
  component: SessionsPage,
});

const routeTree = rootRoute.addChildren([
  overviewRoute,
  failuresRoute,
  latencyRoute,
  sessionsRoute,
]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultPreload: "intent",
  scrollRestoration: true,
});

// Makes Link, useParams and navigate fully typed everywhere.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
