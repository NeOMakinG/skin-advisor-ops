import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { rootRoute } from "@/router";
import type { Scope } from "@/schemas/scope";

// The partner and time range live in the URL (validated by the root route), so every screen
// shares one scope and a link reproduces exactly what someone was looking at.
export function useScope(): Scope {
  return rootRoute.useSearch();
}

export function useSetScope() {
  const navigate = useNavigate();
  return useCallback(
    (patch: Partial<Scope>) =>
      navigate({ to: ".", search: (prev) => ({ ...prev, ...patch }), replace: true }),
    [navigate],
  );
}
