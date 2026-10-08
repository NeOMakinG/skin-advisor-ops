// Small deterministic PRNG so mock data is identical on every load, in tests and in the e2e.

export function hashKey(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max]. */
  int(min: number, max: number): number;
  /** Normal-ish value around `mean` with the given spread, clamped to >= 0. */
  around(mean: number, spread: number): number;
  /** Multiplicative noise in [1 - amount, 1 + amount]. */
  wobble(amount: number): number;
  pick<T>(items: readonly T[]): T;
  weighted<T extends string>(weights: Record<T, number>): T;
}

export function rng(seed: string): Rng {
  let a = hashKey(seed) || 1;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const self: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    around: (mean, spread) => Math.max(0, mean + (next() + next() + next() - 1.5) * spread),
    wobble: (amount) => 1 + (next() * 2 - 1) * amount,
    pick: (items) => {
      const item = items[Math.floor(next() * items.length)];
      if (item === undefined) throw new Error("pick() on an empty list");
      return item;
    },
    weighted: (weights) => {
      const entries = Object.entries(weights) as [never, number][];
      const total = entries.reduce((sum, [, w]) => sum + w, 0);
      let roll = next() * total;
      for (const [key, w] of entries) {
        roll -= w;
        if (roll <= 0) return key;
      }
      const last = entries[entries.length - 1];
      if (!last) throw new Error("weighted() on an empty record");
      return last[0];
    },
  };
  return self;
}
