// Date helpers on ISO "YYYY-MM-DD" strings, computed in UTC so results never depend on
// the browser timezone.

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** `days` consecutive dates ending at `end`, oldest first. */
export function datesEnding(end: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => addDays(end, i - (days - 1)));
}

export function weekday(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay();
}

export function formatDay(isoDate: string, style: "short" | "long" = "short"): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    ...(style === "long" ? { weekday: "short", year: "numeric" } : {}),
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
