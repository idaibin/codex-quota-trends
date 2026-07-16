import { describe, expect, it } from "vitest";
import {
  buildContinuousTimeTicks,
  buildResetAwareTrayHistory,
  countQuotaResets,
  downsampleTrayHistory,
} from "./trend-chart";

describe("tray trend reset rendering", () => {
  it("inserts a vertical boundary when remaining quota resets", () => {
    const { data, hasReset } = buildResetAwareTrayHistory([
      { timestamp: 100, usedPercent: 32 },
      { timestamp: 200, usedPercent: 48 },
      { timestamp: 300, usedPercent: 0 },
      { timestamp: 400, usedPercent: 3 },
    ]);

    expect(hasReset).toBe(true);
    expect(data.map((point) => [point.timestamp, point.remainingPercent])).toEqual([
      [100, 68],
      [200, 52],
      [300, 52],
      [300, 100],
      [400, 97],
    ]);
    expect(
      data.findIndex((point, index) => data[index - 1]?.resetBoundary && !point.resetBoundary),
    ).toBe(3);
  });

  it("does not add a boundary for ordinary quota corrections", () => {
    const { data, hasReset } = buildResetAwareTrayHistory([
      { timestamp: 100, usedPercent: 32 },
      { timestamp: 200, usedPercent: 28 },
    ]);

    expect(hasReset).toBe(false);
    expect(data).toHaveLength(2);
  });

  it("places time ticks at the exact start, midpoint, and end", () => {
    expect(buildContinuousTimeTicks(100, 400)).toEqual([100, 250, 400]);
    expect(buildContinuousTimeTicks(100, 100)).toEqual([100]);
  });

  it("reduces dense history to five-minute buckets", () => {
    const history = Array.from({ length: 601 }, (_, index) => ({
      timestamp: index * 60,
      usedPercent: index < 300 ? 32 : index === 300 ? 48 : Math.min(4, index - 301),
    }));

    const sampled = downsampleTrayHistory(history);

    expect(sampled.length).toBeLessThanOrEqual(130);
    expect(sampled[0]).toEqual(history[0]);
    expect(sampled.at(-1)).toEqual(history.at(-1));
    expect(sampled).toContainEqual(history[300]);
    expect(sampled).toContainEqual(history[301]);
  });

  it("counts resets in the latest 24-hour window", () => {
    expect(
      countQuotaResets([
        { timestamp: 0, usedPercent: 60 },
        { timestamp: 100, usedPercent: 5 },
        { timestamp: 86_500, usedPercent: 48 },
        { timestamp: 86_600, usedPercent: 2 },
      ]),
    ).toBe(1);
  });
});
