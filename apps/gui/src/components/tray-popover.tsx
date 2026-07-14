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

const formatResetDateZh = (resetAt: number | null) => {
  if (!resetAt) return "重置时间未知";
  const date = new Date(resetAt * 1_000);
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${date.getMonth() + 1}月${date.getDate()}日 ${hour}:${minute} 重置`;
};

export function TrayPopover({ data }: { data: DashboardData }) {
  const quotaWindow = data.snapshot.windows[0];

  if (!quotaWindow)
    return <div className="tray-popover tray-popover--empty">正在等待额度数据…</div>;
  const remaining = 100 - Math.min(100, Math.max(0, quotaWindow.usedPercent));
  const firstPoint = data.history[0];
  const lastPoint = data.history.at(-1);
  const historySpan =
    firstPoint && lastPoint ? Math.max(0, lastPoint.timestamp - firstPoint.timestamp) : 0;
  const rangeLabel = historySpan >= 2 * 86_400 ? "7天" : "24小时";
  return (
    <div className="tray-popover">
      <main className="tray-overview">
        <section className="tray-remaining-hero">
          <div className="tray-remaining-copy">
            <span>{formatWindowZh(quotaWindow.windowMinutes)}</span>
            <strong>{formatPercent(remaining)}</strong>
          </div>
        </section>
        <section className="tray-trend-section">
          <div className="tray-chart-heading">
            <h2>{formatResetDateZh(quotaWindow.resetAt)}</h2>
            <span>
              {rangeLabel} · 已消耗 <strong>{formatPercent(data.consumedPercent)}</strong>
            </span>
          </div>
          <TrayRemainingChart history={data.history} />
        </section>
      </main>
    </div>
  );
}
