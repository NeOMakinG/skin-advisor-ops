import { Link, Outlet } from "@tanstack/react-router";
import { ScanFaceIcon } from "lucide-react";
import { ScopeBar } from "@/components/layout/scope-bar";

const nav = [
  { to: "/", label: "Overview" },
  { to: "/failures", label: "Failures" },
  { to: "/latency", label: "Latency" },
  { to: "/sessions", label: "Sessions" },
] as const;

export function AppShell() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full min-w-0 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link
            to="/"
            search={(prev) => prev}
            className="flex shrink-0 items-center gap-2 rounded-md py-1 font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ScanFaceIcon className="size-4" aria-hidden="true" />
            </span>
            <span className="hidden sm:inline">Advisor Ops</span>
          </Link>
          <nav
            aria-label="Main"
            className="-mb-px flex min-w-0 flex-1 items-center gap-0.5 self-stretch overflow-x-auto"
          >
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                search={(prev) => prev}
                activeOptions={{ exact: item.to === "/" }}
                className="flex shrink-0 items-center border-b-2 border-transparent px-3 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[status=active]:border-primary data-[status=active]:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <ScopeBar />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t">
        <p className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          Independent concept by Valentin Szczupak. Not affiliated with or endorsed by{" "}
          {"Revieve Oy"}.
        </p>
      </footer>
    </div>
  );
}
