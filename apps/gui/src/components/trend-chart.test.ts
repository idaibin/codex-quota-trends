import { describe, expect, it } from "vitest";
import {
  buildAvailablePercentScale,
  buildResetAwareTrayHistory,
  buildTrayChartData,
  countQuotaResets,
  selectTrayChangeHistory,
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
    expect(data.map((point) => point.sourceIndex)).toEqual([0, 1, 2, 2, 3]);
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

  it("scales percentages around available values instead of forcing zero to one hundred", () => {
    expect(
      buildAvailablePercentScale([{ remainingPercent: 91 }, { remainingPercent: 88 }]),
    ).toEqual({ domain: [87, 92], ticks: [88, 91] });
  });

  it("keeps a stable visible range when all available values are equal", () => {
    expect(buildAvailablePercentScale([{ remainingPercent: 88 }])).toEqual({
      domain: [87, 89],
      ticks: [88],
    });
  });

  it("keeps only changed values for the tray chart", () => {
    expect(
      selectTrayChangeHistory([
        { timestamp: 100, usedPercent: 9 },
        { timestamp: 200, usedPercent: 9 },
        { timestamp: 300, usedPercent: 10 },
        { timestamp: 400, usedPercent: 10 },
        { timestamp: 500, usedPercent: 12 },
      ]),
    ).toEqual([
      { timestamp: 100, usedPercent: 9 },
      { timestamp: 300, usedPercent: 10 },
      { timestamp: 500, usedPercent: 12 },
    ]);
  });

  it("keeps at most the latest one hundred changed values", () => {
    const history = Array.from({ length: 125 }, (_, index) => ({
      timestamp: index * 60,
      usedPercent: index,
    }));

    const selected = selectTrayChangeHistory(history);

    expect(selected).toHaveLength(100);
    expect(selected[0]).toEqual(history[25]);
    expect(selected.at(-1)).toEqual(history.at(-1));
  });

  it("caps rendered points after reset boundaries are inserted", () => {
    const history = Array.from({ length: 125 }, (_, index) => ({
      timestamp: index * 60,
      usedPercent: index % 2 === 0 ? 80 : 5,
    }));

    expect(buildTrayChartData(history)).toHaveLength(100);
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
