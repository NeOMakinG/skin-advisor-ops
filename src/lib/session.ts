import { useSyncExternalStore } from "react";
import { defaultUser } from "@/data/users";
import type { UserId } from "@/lib/ids";

// Who is "signed in". A tiny external store so the tRPC link and React both read the same value.
let viewerId: UserId = defaultUser.id;
const listeners = new Set<() => void>();

export const session = {
  get viewerId() {
    return viewerId;
  },
  setViewerId(next: UserId) {
    viewerId = next;
    for (const l of listeners) l();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useViewerId(): UserId {
  return useSyncExternalStore(
    session.subscribe,
    () => viewerId,
    () => viewerId,
  );
}
