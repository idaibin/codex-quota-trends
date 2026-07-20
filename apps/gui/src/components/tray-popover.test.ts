import { describe, expect, it } from "vitest";
import {
  formatExpiryDate,
  formatResetCountdown,
  isExpiryUrgent,
  selectTrayHistory,
} from "./tray-popover";

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

  it("formats reset countdowns to the minute", () => {
    expect(formatResetCountdown(90_060, 0)).toBe("01:01:01");
    expect(formatResetCountdown(3_660, 0)).toBe("00:01:01");
    expect(formatResetCountdown(60, 0)).toBe("00:00:01");
    expect(formatResetCountdown(0, 0)).toBe("--:--:--");
  });

  it("formats only the expiry date", () => {
    const expiresAt = new Date(2026, 6, 27, 7, 28).getTime() / 1_000;
    expect(formatExpiryDate(expiresAt)).toBe("7月27日");
  });

  it("highlights expiry only during the final 24 hours", () => {
    expect(isExpiryUrgent(86_400, 0)).toBe(true);
    expect(isExpiryUrgent(86_401, 0)).toBe(false);
    expect(isExpiryUrgent(0, 1)).toBe(false);
  });
});
