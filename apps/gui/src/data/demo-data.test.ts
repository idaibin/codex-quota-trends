import { describe, expect, it } from "vitest";
import { demoDashboard, demoHistory } from "./demo-data";

describe("tray demo data", () => {
  it("keeps the latest integer history value aligned with the snapshot", () => {
    const latestHistory = demoHistory.at(-1);
    const currentWindow = demoDashboard.snapshot.windows[0];

    expect(latestHistory?.usedPercent).toBe(currentWindow?.usedPercent);
    expect(demoHistory.every((point) => Number.isInteger(point.usedPercent))).toBe(true);
    expect(100 - (latestHistory?.usedPercent ?? 0)).toBe(97);
    expect(Math.max(...demoHistory.map((point) => point.usedPercent))).toBe(49);
    expect(demoDashboard.consumedPercent).toBe(20);
  });
});
