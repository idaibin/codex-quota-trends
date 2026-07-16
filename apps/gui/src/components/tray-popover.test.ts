import { describe, expect, it } from "vitest";
import { selectTrayHistory } from "./tray-popover";

describe("tray history selection", () => {
  const history = [
    { timestamp: 100, usedPercent: 10 },
    { timestamp: 200, usedPercent: 20 },
  ];
  const weekHistory = [
    { timestamp: 300, usedPercent: 30 },
    { timestamp: 400, usedPercent: 40 },
  ];

  it("uses the persisted seven-day history preference", () => {
    expect(selectTrayHistory({ history, weekHistory }, 168)).toEqual({
      history: weekHistory,
      rangeHours: 168,
    });
  });

  it("falls back to the 24-hour history for unsupported values", () => {
    expect(selectTrayHistory({ history, weekHistory }, 48)).toEqual({
      history,
      rangeHours: 24,
    });
  });
});
