import { describe, expect, it } from "vitest";
import { demoHistory } from "../data/demo-data";
import {
  aggregateTrayHistory,
  buildAvailablePercentScale,
  buildResetAwareTrayHistory,
  buildTrayChartData,
  buildTrayRenderableData,
  countQuotaResets,
  formatTrayPercentTick,
  getCurrentMarkerLayout,
  getTrayHorizontalGuideTicks,
  trayIntervalSeconds,
} from "./trend-chart";

describe("tray trend reset rendering", () => {
  it("uses a small compact marker and a narrow numeric-label rail", () => {
    expect(getCurrentMarkerLayout(true, 82)).toEqual({
      dotRadius: 1,
      haloRadius: 2,
      labelFontSize: 9,
      labelOffset: 5,
      rightMargin: 17,
      strokeWidth: 0,
    });
    expect(getCurrentMarkerLayout(true, 100).rightMargin).toBe(22);
    expect(getCurrentMarkerLayout(false, 82)).toEqual({
      dotRadius: 4,
      haloRadius: 8,
      labelFontSize: 12,
      labelOffset: 8,
      rightMargin: 40,
      strokeWidth: 1,
    });
  });

  it("renders tray Y-axis ticks without percent signs", () => {
    expect(formatTrayPercentTick(82.4)).toBe("82");
  });

  it("omits the top horizontal guide to keep it clear of near-maximum trend lines", () => {
    expect(getTrayHorizontalGuideTicks([0, 50, 100])).toEqual([0, 50]);
  });

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

  it("scales percentages around available values instead of forcing zero to one hundred", () => {
    const scale = buildAvailablePercentScale([
      { remainingPercent: 54 },
      { remainingPercent: 72 },
      { remainingPercent: 89 },
    ]);

    expect(scale.ticks).toEqual([50, 70, 90]);
    expect(scale.ticks[1] - scale.ticks[0]).toBe(scale.ticks[2] - scale.ticks[1]);
    expect(scale.domain[0]).toBeLessThan(54);
    expect(scale.domain[1]).toBeGreaterThan(89);
  });

  it("keeps a stable visible range when all available values are equal", () => {
    expect(buildAvailablePercentScale([{ remainingPercent: 88 }])).toEqual({
      domain: [86, 90],
      ticks: [87, 88, 89],
    });
  });

  it("keeps a reset-to-one-hundred scale focused on the observed lower range", () => {
    expect(
      buildAvailablePercentScale([{ remainingPercent: 45 }, { remainingPercent: 100 }]).ticks,
    ).toEqual([40, 70, 100]);
  });

  it("uses focused rounded guides for the tray demo reset history", () => {
    const data = buildTrayChartData(demoHistory, 24);

    expect(Math.min(...data.map((point) => point.remainingPercent))).toBe(45);
    expect(Math.max(...data.map((point) => point.remainingPercent))).toBe(100);
    expect(buildAvailablePercentScale(data).ticks).toEqual([40, 70, 100]);
  });

  it("uses thirty-minute intervals for one day and two-hour intervals for one week", () => {
    expect(trayIntervalSeconds(24)).toBe(1_800);
    expect(trayIntervalSeconds(168)).toBe(7_200);
  });

  it("aggregates interval consumption while keeping the latest real timestamp and value", () => {
    expect(
      aggregateTrayHistory(
        [
          { timestamp: 0, usedPercent: 10 },
          { timestamp: 600, usedPercent: 11 },
          { timestamp: 1_200, usedPercent: 14 },
          { timestamp: 2_000, usedPercent: 15 },
        ],
        24,
      ).map((point) => [point.timestamp, point.usedPercent, point.consumedPercent]),
    ).toEqual([
      [0, 10, 0],
      [1_200, 14, 4],
      [2_000, 15, 1],
    ]);
  });

  it("keeps an unchanged latest observation as the continuous-time endpoint", () => {
    const data = aggregateTrayHistory(
      [
        { timestamp: 0, usedPercent: 10 },
        { timestamp: 600, usedPercent: 10 },
      ],
      24,
    );

    expect(data.map((point) => point.timestamp)).toEqual([0, 600]);
    expect(data.at(-1)?.consumedPercent).toBe(0);
  });

  it("does not merge a reset across an interval or invent a one-hundred-percent remainder", () => {
    const data = buildTrayChartData(
      [
        { timestamp: 0, usedPercent: 40 },
        { timestamp: 600, usedPercent: 52 },
        { timestamp: 900, usedPercent: 17 },
        { timestamp: 1_200, usedPercent: 19 },
      ],
      24,
    );

    expect(data.map((point) => [point.timestamp, point.remainingPercent])).toEqual([
      [0, 60],
      [600, 48],
      [900, 48],
      [900, 83],
      [1_200, 81],
    ]);
    expect(data.find((point) => point.resetStart)?.remainingPercent).toBe(83);
    expect(data.find((point) => point.resetBoundary)?.resetToPercent).toBe(83);
  });

  it("does not turn multiple sub-threshold corrections in one interval into a reset", () => {
    const data = buildTrayChartData(
      [
        { timestamp: 0, usedPercent: 60 },
        { timestamp: 300, usedPercent: 41 },
        { timestamp: 600, usedPercent: 22 },
      ],
      24,
    );

    expect(data.some((point) => point.resetBoundary || point.resetStart)).toBe(false);
    expect(data.at(-1)?.correctedPercent).toBe(38);
  });

  it("caps rendered points after reset boundaries are inserted", () => {
    const history = Array.from({ length: 125 }, (_, index) => ({
      timestamp: index * 60,
      usedPercent: index % 2 === 0 ? 80 : 5,
    }));

    expect(buildTrayChartData(history)).toHaveLength(100);
  });

  it("keeps the latest point in tooltip data while ending the history line before it", () => {
    const data = buildTrayRenderableData([
      { timestamp: 100, usedPercent: 9 },
      { timestamp: 2_000, usedPercent: 17 },
      { timestamp: 4_000, usedPercent: 35 },
    ]);

    expect(data.map((point) => point.remainingPercent)).toEqual([91, 83, 65]);
    expect(data.map((point) => point.historyRemainingPercent)).toEqual([91, 83, null]);
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
