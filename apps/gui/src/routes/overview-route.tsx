import { CalendarBlank, CheckCircle, Gauge, TrendUp } from "@phosphor-icons/react";
import type { DashboardData } from "../types";
import { formatPercent, formatResetDuration, formatWindow } from "../utils/format";
import { CollectorStatus } from "../components/collector-status";
import { Panel, SectionTitle } from "../components/ui";
import { QuotaRing } from "../components/quota-ring";
import { UsageAreaChart } from "../components/trend-chart";

export function OverviewRoute({ data }: { data: DashboardData }) {
  const quotaWindow = data.snapshot.windows[0];
  if (!quotaWindow)
    return <Panel className="empty-panel">Waiting for the first quota snapshot…</Panel>;
  const statusText =
    data.pace.status === "above"
      ? "Above Pace"
      : data.pace.status === "below"
        ? "Below Pace"
        : "On Pace";
  const reset = quotaWindow.resetAt ? new Date(quotaWindow.resetAt * 1000) : null;

  return (
    <div className="overview-page">
      <div className="overview-top-grid">
        <Panel className="quota-panel">
          <SectionTitle>
            Current Quota <span>({formatWindow(quotaWindow.windowMinutes)})</span>
          </SectionTitle>
          <QuotaRing quotaWindow={quotaWindow} />
        </Panel>
        <Panel className="pace-panel">
          <SectionTitle info>Usage Pace</SectionTitle>
          <strong className={`pace-status pace-status--${data.pace.status}`}>{statusText}</strong>
          <p>
            You’re using quota {data.pace.status === "above" ? "faster than" : "in line with"} the
            average pace.
          </p>
          <div className="progress-group">
            <div>
              <span>Time Progress</span>
              <strong>{formatPercent(data.pace.timeProgress)}</strong>
            </div>
            <progress value={data.pace.timeProgress} max="100" />
          </div>
          <div className="progress-group progress-group--danger">
            <div>
              <span>Usage Progress</span>
              <strong>{formatPercent(data.pace.usageProgress)}</strong>
            </div>
            <progress value={data.pace.usageProgress} max="100" />
          </div>
        </Panel>
        <Panel className="collector-panel">
          <SectionTitle>Collector</SectionTitle>
          <CollectorStatus collector={data.collector} />
        </Panel>
      </div>
      <Panel className="usage-panel">
        <SectionTitle>
          Usage Over Time <span>(24h)</span>
        </SectionTitle>
        <UsageAreaChart history={data.history} />
      </Panel>
      <div className="overview-bottom-grid">
        <Panel className="metric-panel">
          <SectionTitle>
            <Gauge size={23} color="var(--accent)" />
            Usage Speed
          </SectionTitle>
          <dl className="speed-list">
            <div>
              <dt>15m</dt>
              <dd>
                {formatPercent(data.speeds.fifteenMinutes)} <TrendUp />
              </dd>
            </div>
            <div>
              <dt>1h</dt>
              <dd>
                {formatPercent(data.speeds.oneHour)} <TrendUp />
              </dd>
            </div>
            <div>
              <dt>24h</dt>
              <dd>
                {formatPercent(data.speeds.twentyFourHours)} <TrendUp />
              </dd>
            </div>
          </dl>
        </Panel>
        <Panel className="metric-panel">
          <SectionTitle>
            <CalendarBlank size={23} color="var(--accent)" />
            Reset Time
          </SectionTitle>
          <strong className="large-date">
            {reset
              ? new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(reset)
              : "Unknown"}
          </strong>
          <p>
            {reset
              ? new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(
                  reset,
                )
              : "No reset reported"}{" "}
            (Local Time)
          </p>
          <span className="subtle-label">{formatResetDuration(quotaWindow.resetAt)} remaining</span>
        </Panel>
        <Panel className="metric-panel">
          <SectionTitle>
            <CheckCircle size={23} color="var(--accent)" />
            Status
          </SectionTitle>
          <strong className="normal-status">Normal</strong>
          <p>All systems operational</p>
          <span className="subtle-label">No unresolved critical alerts</span>
        </Panel>
      </div>
    </div>
  );
}
