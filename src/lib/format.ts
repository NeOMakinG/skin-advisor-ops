import type { Currency } from "@/schemas/partner";

const en = "en-US";

export function formatCount(n: number): string {
  return n.toLocaleString(en);
}

export function formatCompactCount(n: number): string {
  return new Intl.NumberFormat(en, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** Signed percentage points, e.g. "+9.4 pp". */
export function formatPp(delta: number, digits = 1): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
  return `${sign}${Math.abs(delta).toFixed(digits)} pp`;
}

/** Signed relative change, e.g. "+12%". */
export function formatChange(ratio: number): string {
  const pct = ratio * 100;
  const sign = pct > 0 ? "+" : pct < 0 ? "-" : "";
  return `${sign}${Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%`;
}

export function formatMs(ms: number): string {
  if (ms >= 10_000) return `${(ms / 1000).toFixed(0)} s`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms)} ms`;
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

const moneyFormatters = new Map<Currency, Intl.NumberFormat>();

export function formatMoney(amount: number, currency: Currency): string {
  let f = moneyFormatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat(en, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
    });
    moneyFormatters.set(currency, f);
  }
  return f.format(amount);
}
