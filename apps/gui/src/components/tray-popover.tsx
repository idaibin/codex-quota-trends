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
import { formatPercent } from "../utils/format";
import { TrayRemainingChart } from "./trend-chart";

const formatWindowZh = (minutes: number | null) => {
  if (!minutes) return "当前额度";
  if (minutes % 10_080 === 0) return `${minutes / 10_080} 周额度剩余`;
  if (minutes % 1_440 === 0) return `${minutes / 1_440} 天额度剩余`;
  if (minutes % 60 === 0) return `${minutes / 60} 小时额度剩余`;
  return `${minutes} 分钟额度剩余`;
};

const formatResetZh = (resetAt: number | null) => {
  if (!resetAt) return "重置时间未知";
  const minutes = Math.max(0, Math.floor((resetAt - Date.now() / 1_000) / 60));
  const days = Math.floor(minutes / 1_440);
  const hours = Math.floor((minutes % 1_440) / 60);
  const remainder = minutes % 60;
  return `${days > 0 ? `${days}天` : ""}${hours > 0 ? `${hours}小时` : ""}${remainder}分钟后重置`;
};

const formatUpdatedZh = (timestamp: number | null) => {
  if (!timestamp) return "尚未更新";
  const seconds = Math.max(0, Date.now() / 1_000 - timestamp);
  if (seconds < 60) return "刚刚更新";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前更新`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前更新`;
  return `${Math.floor(hours / 24)} 天前更新`;
};

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
    return <div className="tray-popover tray-popover--empty">正在等待额度数据…</div>;
  const remaining = 100 - Math.min(100, Math.max(0, quotaWindow.usedPercent));
  const firstPoint = data.history[0];
  const lastPoint = data.history.at(-1);
  const remainingChange =
    firstPoint && lastPoint ? firstPoint.usedPercent - lastPoint.usedPercent : 0;
  const ChangeIcon = remainingChange > 0 ? TrendUp : remainingChange < 0 ? TrendDown : Minus;
  const historySpan =
    firstPoint && lastPoint ? Math.max(0, lastPoint.timestamp - firstPoint.timestamp) : 0;
  const rangeLabel = historySpan >= 2 * 86_400 ? "7天" : "24小时";
  const collectorLabel = paused
    ? "采集器已暂停"
    : data.collector.status === "connected"
      ? "采集器已连接"
      : data.collector.status === "connecting"
        ? "采集器连接中"
        : "采集器已离线";
  return (
    <div className="tray-popover">
      <header className="tray-statusbar">
        <div className="tray-collector-summary">
          <i className={`status-dot status-dot--${paused ? "paused" : data.collector.status}`} />
          <div>
            <strong>{collectorLabel}</strong>
            <span>{formatUpdatedZh(data.collector.lastUpdateAt)}</span>
          </div>
        </div>
        <div className="tray-statusbar-actions">
          <button
            type="button"
            aria-label={paused ? "恢复采集" : "暂停采集"}
            onClick={() => void togglePause()}
          >
            {paused ? <PlayCircle /> : <PauseCircle />}
          </button>
          <button
            className="quit-action"
            type="button"
            aria-label="退出应用"
            onClick={() => void quitApp()}
          >
            <Power />
          </button>
          <button type="button" aria-label="打开设置" onClick={() => void showSettings()}>
            <Gear />
          </button>
        </div>
      </header>
      <main className="tray-overview">
        <section className="tray-remaining-hero">
          <div className="tray-remaining-copy">
            <span>{formatWindowZh(quotaWindow.windowMinutes)}</span>
            <strong>{formatPercent(remaining)}</strong>
            <small>{formatResetZh(quotaWindow.resetAt)}</small>
          </div>
          <div className="tray-remaining-change">
            <ChangeIcon weight="bold" />
            <strong>
              {remainingChange > 0 ? "+" : ""}
              {remainingChange.toFixed(1)} 个百分点
            </strong>
            <span>区间变化</span>
          </div>
        </section>
        <section className="tray-trend-section">
          <div className="tray-chart-heading">
            <h2>剩余额度趋势</h2>
            <span>{rangeLabel}</span>
          </div>
          <TrayRemainingChart history={data.history} />
        </section>
      </main>
    </div>
  );
}
