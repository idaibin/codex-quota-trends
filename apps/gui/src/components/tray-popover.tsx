import {
  Gear,
  Minus,
  PauseCircle,
  PlayCircle,
  Power,
  TrendDown,
  TrendUp,
} from "@phosphor-icons/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState } from "react";
import { pauseCollector, quitApp } from "../api/quota-api";
import type { DashboardData } from "../types";
import {
  formatPercent,
  formatRelativeTime,
  formatResetDuration,
  formatWindow,
} from "../utils/format";
import { TrayRemainingChart } from "./trend-chart";

export function TrayPopover({ data }: { data: DashboardData }) {
  const [paused, setPaused] = useState(data.collector.status === "paused");
  const quotaWindow = data.snapshot.windows[0];
  const showSettings = async () => {
    localStorage.setItem("cqt:requested-route", "settings");
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const main = await WebviewWindow.getByLabel("main");
    await main?.show();
    await main?.setFocus();
    await getCurrentWindow().hide();
  };
  const togglePause = async () => {
    const next = !paused;
    await pauseCollector(next);
    setPaused(next);
  };

  if (!quotaWindow)
    return <div className="tray-popover tray-popover--empty">Waiting for quota data…</div>;
  const remaining = 100 - Math.min(100, Math.max(0, quotaWindow.usedPercent));
  const firstPoint = data.history[0];
  const lastPoint = data.history.at(-1);
  const remainingChange =
    firstPoint && lastPoint ? firstPoint.usedPercent - lastPoint.usedPercent : 0;
  const ChangeIcon = remainingChange > 0 ? TrendUp : remainingChange < 0 ? TrendDown : Minus;
  const historySpan =
    firstPoint && lastPoint ? Math.max(0, lastPoint.timestamp - firstPoint.timestamp) : 0;
  const rangeLabel = historySpan >= 2 * 86_400 ? "7D" : "24H";
  const collectorLabel = paused
    ? "Collector paused"
    : data.collector.status === "connected"
      ? "Collector connected"
      : data.collector.status === "connecting"
        ? "Collector connecting"
        : "Collector offline";
  return (
    <div className="tray-popover">
      <header>
        <div className="brand">
          <img src="/app-mark.png" alt="" />
          <strong>Codex Quota Trends</strong>
        </div>
        <button
          className="tray-icon-button"
          type="button"
          aria-label="Open settings"
          onClick={() => void showSettings()}
        >
          <Gear size={22} />
        </button>
      </header>
      <main className="tray-overview">
        <section className="tray-remaining-hero">
          <div className="tray-remaining-copy">
            <span>{formatWindow(quotaWindow.windowMinutes)} remaining</span>
            <strong>{formatPercent(remaining)}</strong>
            <small>{formatResetDuration(quotaWindow.resetAt)} until reset</small>
          </div>
          <div className="tray-remaining-change">
            <ChangeIcon weight="bold" />
            <strong>
              {remainingChange > 0 ? "+" : ""}
              {remainingChange.toFixed(1)} pts
            </strong>
            <span>in range</span>
          </div>
        </section>
        <section className="tray-trend-section">
          <div className="tray-chart-heading">
            <div>
              <h2>Remaining trend</h2>
              <p>Quota available over time</p>
            </div>
            <span>{rangeLabel}</span>
          </div>
          <TrayRemainingChart history={data.history} />
        </section>
      </main>
      <footer className="tray-footer">
        <div className="tray-collector-summary">
          <i className={`status-dot status-dot--${paused ? "paused" : data.collector.status}`} />
          <div>
            <strong>{collectorLabel}</strong>
            <span>Updated {formatRelativeTime(data.collector.lastUpdateAt).toLowerCase()}</span>
          </div>
        </div>
        <div className="tray-footer-actions">
          <button
            type="button"
            aria-label={paused ? "Resume collector" : "Pause collector"}
            onClick={() => void togglePause()}
          >
            {paused ? <PlayCircle /> : <PauseCircle />}
          </button>
          <button
            className="quit-action"
            type="button"
            aria-label="Quit"
            onClick={() => void quitApp()}
          >
            <Power />
          </button>
        </div>
      </footer>
    </div>
  );
}
