import { CalendarBlank, Clock, CreditCard } from "@phosphor-icons/react";
import { useMemo } from "react";
import type { AppSettings, DashboardData, TrendPoint } from "../types";
import { TrayRemainingChart } from "./trend-chart";

const formatResetDate = (resetAt: number | null) => {
  if (!resetAt) return "时间未知";
  const date = new Date(resetAt * 1_000);
  const day = new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date);
  const time = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${day} ${time}`;
};

export function selectTrayHistory(
  data: Pick<DashboardData, "history" | "weekHistory">,
  trayHistoryHours: number,
): { history: TrendPoint[]; rangeHours: 24 | 168 } {
  const rangeHours = trayHistoryHours === 168 ? 168 : 24;
  const source = rangeHours === 168 ? data.weekHistory : data.history;
  const lastTimestamp = source.at(-1)?.timestamp ?? Math.floor(Date.now() / 1_000);
  const firstTimestamp = lastTimestamp - rangeHours * 3_600;
  return { history: source.filter((point) => point.timestamp >= firstTimestamp), rangeHours };
}

export function TrayPopover({ data, settings }: { data: DashboardData; settings: AppSettings }) {
  const quotaWindow = data.snapshot.windows[0];

  const { history, rangeHours } = useMemo(
    () => selectTrayHistory(data, settings.trayHistoryHours),
    [data, settings.trayHistoryHours],
  );
  const rangeLabel = rangeHours === 168 ? "过去 7 天" : "过去 24 小时";

  if (!quotaWindow)
    return <div className="tray-popover tray-popover--empty">正在等待额度数据…</div>;

  return (
    <div className="tray-popover">
      <main className="tray-content">
        <section className="tray-card tray-reset-card" aria-label="额度重置摘要">
          <div className="tray-reset-group">
            <span className="tray-summary-icon">
              <CalendarBlank size={13} weight="regular" />
            </span>
            <div className="tray-reset-date">
              <span>下次重置</span>
              <strong>{formatResetDate(quotaWindow.resetAt)}</strong>
            </div>
          </div>
          <div className="tray-reset-group tray-reset-group--credits">
            <span className="tray-summary-icon tray-summary-icon--small">
              <CreditCard size={12} weight="fill" />
            </span>
            <div className="tray-reset-credits">
              <span>重置卡</span>
              <strong>
                {data.resetCreditsAvailable == null ? (
                  "暂无数据"
                ) : (
                  <>
                    可用 <b>{data.resetCreditsAvailable}</b> 次
                  </>
                )}
              </strong>
            </div>
          </div>
        </section>

        <section className="tray-card tray-chart-card">
          <header className="tray-chart-heading">
            <div className="tray-range-badge" aria-label={`趋势时间范围：${rangeLabel}`}>
              <Clock size={9} weight="regular" />
              <span>{rangeLabel}</span>
            </div>
          </header>
          <TrayRemainingChart history={history} rangeSeconds={rangeHours * 3_600} compact />
        </section>
      </main>
    </div>
  );
}
