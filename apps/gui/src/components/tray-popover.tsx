import type { DashboardData } from "../types";
import { formatPercent } from "../utils/format";
import { TrayRemainingChart } from "./trend-chart";

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
  return (
    <div className="tray-popover">
      <main className="tray-overview">
        <section className="tray-trend-section">
          <div className="tray-chart-heading">
            <h2>{formatResetDateZh(quotaWindow.resetAt)}</h2>
            <span>
              24小时 · 已消耗 <strong>{formatPercent(data.consumedPercent)}</strong>
            </span>
          </div>
          <TrayRemainingChart history={data.history} />
        </section>
      </main>
    </div>
  );
}
