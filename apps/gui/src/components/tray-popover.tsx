import { CaretRight, Gear, Monitor, PauseCircle, PlayCircle, Power } from "@phosphor-icons/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState } from "react";
import { pauseCollector, quitApp } from "../api/quota-api";
import type { DashboardData } from "../types";
import { formatWindow } from "../utils/format";
import { CollectorStatus } from "./collector-status";
import { QuotaRing } from "./quota-ring";
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
        <h2>
          Current Quota <span>({formatWindow(quotaWindow.windowMinutes)})</span>
        </h2>
        <QuotaRing quotaWindow={quotaWindow} />
        <div className="tray-chart-title">
          Usage Over Time <span>(7d)</span>
        </div>
        <UsageAreaChart history={data.history} compact />
      </section>
      <CollectorStatus
        collector={{ ...data.collector, status: paused ? "paused" : data.collector.status }}
      />
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
