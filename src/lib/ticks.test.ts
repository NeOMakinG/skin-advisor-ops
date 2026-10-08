import { describe, expect, it } from "vitest";
import { niceTicks } from "./ticks";

describe("niceTicks", () => {
  it("rounds to clean steps that cover the maximum", () => {
    expect(niceTicks(2190)).toEqual([0, 500, 1000, 1500, 2000, 2500]);
    expect(niceTicks(9800, 4)).toEqual([0, 2500, 5000, 7500, 10000]);
    expect(niceTicks(11_900)).toEqual([0, 2500, 5000, 7500, 10000, 12500]);
  });

  it("handles an empty series", () => {
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});
