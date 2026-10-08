import { users } from "@/data/users";
import type { UserId } from "@/lib/ids";
import { delay } from "@/lib/utils";
import type { User } from "@/schemas/user";

export interface Context {
  viewer: User;
}

// The "network": a small delay so loading states are visible in the browser.
export const SIMULATED_LATENCY_MS = 350;

export async function createContext(viewerId: UserId): Promise<Context> {
  await delay(SIMULATED_LATENCY_MS);
  const viewer = users.find((u) => u.id === viewerId) ?? users[0];
  if (!viewer) throw new Error("No users configured");
  return { viewer };
}
