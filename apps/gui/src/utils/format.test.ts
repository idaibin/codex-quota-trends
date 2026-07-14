import { describe, expect, it } from "vitest";
import { formatBytes, formatPercent, formatResetDuration, formatWindow } from "./format";

describe("format helpers", () => {
  it("formats dynamic quota windows", () => {
    expect(formatWindow(300)).toBe("5 Hours");
    expect(formatWindow(10_080)).toBe("1 Week");
    expect(formatWindow(null)).toBe("Quota");
  });

  it("formats quota percentages as integers", () => {
    expect(formatPercent(32)).toBe("32%");
    expect(formatPercent(4.84)).toBe("5%");
  });

  it("formats database sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1_572_864)).toBe("1.50 MB");
  });

  it("formats time until reset", () => {
    expect(formatResetDuration(200_000, 100_000)).toBe("1d 3h 46m");
  });
});
