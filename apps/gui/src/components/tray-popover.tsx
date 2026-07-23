import { ArrowCounterClockwise, CreditCard } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { AppSettings, DashboardData, TrendPoint } from "../types";
import { TokenActivityCard } from "./token-activity-card";
import { TrayRemainingChart } from "./trend-chart";

export const formatResetCountdown = (resetAt: number | null, now: number) => {
  if (!resetAt) return "待更新";
  const totalMinutes = Math.max(0, Math.ceil((resetAt - now) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}小时`);
  parts.push(`${minutes}分钟`);
  return parts.join(" ");
};

export const formatExpiryDate = (expiresAt: number) => {
  const date = new Date(expiresAt * 1_000);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

export const isExpiryUrgent = (expiresAt: number | null, now: number) =>
  expiresAt != null && expiresAt > now && expiresAt - now <= 86_400;

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
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1_000));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1_000)), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const { history, rangeHours } = useMemo(
    () => selectTrayHistory(data, settings.trayHistoryHours),
    [data, settings.trayHistoryHours],
  );
  return (
    <div className="tray-popover">
      <main className="tray-content">
        <section className="tray-card tray-reset-card" aria-label="额度重置摘要">
          <div className="tray-reset-group">
            <span className="tray-summary-icon" aria-hidden="true">
              <ArrowCounterClockwise size={13} weight="regular" />
            </span>
            <strong>{formatResetCountdown(quotaWindow?.resetAt ?? null, now)}</strong>
          </div>
          <div className="tray-reset-group tray-reset-group--credits">
            <span className="tray-summary-icon tray-summary-icon--small">
              <CreditCard size={12} weight="fill" />
            </span>
            <div
              className="tray-reset-credits"
              aria-label={
                data.resetCreditExpiresAt
                  ? `${data.resetCreditsAvailable ?? 0} 次重置卡，最早于 ${formatExpiryDate(data.resetCreditExpiresAt)} 到期`
                  : undefined
              }
            >
              <strong>
                {data.resetCreditsAvailable == null ? (
                  "暂无数据"
                ) : (
                  <>
                    <b>{data.resetCreditsAvailable}次</b>
                    {data.resetCreditExpiresAt && (
                      <span
                        className={`tray-reset-credit-expiry ${
                          isExpiryUrgent(data.resetCreditExpiresAt, now)
                            ? "tray-reset-credit-expiry--urgent"
                            : ""
                        }`}
                      >
                        {` · ${formatExpiryDate(data.resetCreditExpiresAt)} 到期`}
                      </span>
                    )}
                  </>
                )}
              </strong>
            </div>
          </div>
        </section>

        <section className="tray-card tray-chart-card">
          {quotaWindow ? (
            <TrayRemainingChart history={history} rangeHours={rangeHours} compact />
          ) : (
            <div className="tray-trend-chart tray-trend-chart--empty">正在等待额度数据…</div>
          )}
        </section>

        <TokenActivityCard activity={data.tokenActivity} />
      </main>
    </div>
  );
}
