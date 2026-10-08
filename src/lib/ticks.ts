/** Round axis ticks (0, 500, 1000...) that cover `max`, so an axis never shows 1.3K / 2.6K. */
export function niceTicks(max: number, targetCount = 5): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * magnitude);
  const step = candidates.find((c) => c >= rough) ?? candidates[candidates.length - 1] ?? 1;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}
