import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { AccountPage } from "@/routes/account";
import { NotFoundPage } from "@/routes/not-found";
import { OverviewPage } from "@/routes/overview";

// Code-based routes (no codegen). Hash history keeps deep links working on GitHub Pages.
export const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: NotFoundPage,
});

export const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: OverviewPage,
});

export const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts/$accountId",
  component: AccountPage,
});

const routeTree = rootRoute.addChildren([overviewRoute, accountRoute]);

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
