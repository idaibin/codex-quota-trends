import { CaretRight, Gear, Monitor, PauseCircle, PlayCircle, Power } from "@phosphor-icons/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState } from "react";
import { pauseCollector, quitApp } from "../api/quota-api";
import type { DashboardData } from "../types";
import { formatPercent, formatWindow } from "../utils/format";
import { UsageAreaChart } from "./trend-chart";

export function TrayPopover({ data }: { data: DashboardData }) {
  const [paused, setPaused] = useState(false);
  const quotaWindow = data.snapshot.windows[0];
  const showMain = async (route?: string) => {
    if (route) localStorage.setItem("cqt:requested-route", route);
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
  return (
    <div className="tray-popover">
      <header>
        <div className="brand">
          <img src="/app-mark.png" alt="" />
          <strong>Codex Quota Trends</strong>
        </div>
        <button type="button" aria-label="Open settings" onClick={() => void showMain("settings")}>
          <Gear size={29} />
        </button>
      </header>
      <section className="tray-quota-card">
        <div className="tray-current-remaining">
          <div>
            <span>Current Remaining</span>
            <small>{formatWindow(quotaWindow.windowMinutes)}</small>
          </div>
          <strong>{formatPercent(remaining)}</strong>
        </div>
        <div className="tray-chart-title">
          Remaining Trend <span>(7d)</span>
        </div>
        <UsageAreaChart history={data.history} compact mode="remaining" />
      </section>
      <nav className="tray-actions" aria-label="Tray actions">
        <button type="button" onClick={() => void showMain()}>
          <Monitor />
          <span>Open Dashboard</span>
          <CaretRight />
        </button>
        <button type="button" onClick={() => void togglePause()}>
          {paused ? <PlayCircle /> : <PauseCircle />}
          <span>{paused ? "Resume Collector" : "Pause Collector"}</span>
        </button>
        <button type="button" onClick={() => void showMain("settings")}>
          <Gear />
          <span>Settings</span>
          <CaretRight />
        </button>
        <button className="quit-action" type="button" onClick={() => void quitApp()}>
          <Power />
          <span>Quit</span>
        </button>
      </nav>
    </div>
  );
}
