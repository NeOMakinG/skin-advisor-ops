import { delay } from "@/lib/utils";

export interface Context {
  requestedAt: number;
}

// The "network": a small delay so loading states are visible in the browser.
export const SIMULATED_LATENCY_MS = 300;

export async function createContext(): Promise<Context> {
  await delay(SIMULATED_LATENCY_MS);
  return { requestedAt: Date.now() };
}
