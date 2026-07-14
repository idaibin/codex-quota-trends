import { ArrowUpRight, ShieldCheck } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { DashboardData } from "../types";
import { formatPercent, formatResetDuration, formatWindow } from "../utils/format";
import { Panel, SectionTitle, SegmentedControl, SelectControl } from "../components/ui";
import { QuotaRing } from "../components/quota-ring";
import { SpeedLineChart, UsageAreaChart } from "../components/trend-chart";

type Range = "24h" | "7d" | "30d" | "cycle";

export function TrendsRoute({ data }: { data: DashboardData }) {
  const [range, setRange] = useState<Range>("24h");
  const quotaWindow = data.snapshot.windows[0];
  const history = useMemo(() => data.history, [data.history]);
  if (!quotaWindow) return <Panel className="empty-panel">No trend data yet.</Panel>;
  const projected = Math.min(
    100,
    Math.round(quotaWindow.usedPercent + data.speeds.twentyFourHours * 2.7),
  );

  return (
    <div className="trends-page">
      <SegmentedControl
        value={range}
        onChange={setRange}
        options={[
          { value: "24h", label: "24 Hours" },
          { value: "7d", label: "7 Days" },
          { value: "30d", label: "30 Days" },
          { value: "cycle", label: "This Cycle" },
        ]}
      />
      <Panel className="trend-main-panel">
        <div className="panel-heading-row">
          <SectionTitle info>Usage Percentage</SectionTitle>
          <div className="trend-summary">
            <strong>{formatPercent(quotaWindow.usedPercent)}</strong>
            <span>Used</span>
            <b>{formatResetDuration(quotaWindow.resetAt)}</b>
            <span>Until Reset</span>
          </div>
        </div>
        <UsageAreaChart history={history} />
      </Panel>
      <Panel className="speed-panel">
        <div className="panel-heading-row">
          <SectionTitle info>Usage Speed</SectionTitle>
          <SelectControl defaultValue="hour">
            <option value="hour">Percentage per hour</option>
            <option value="day">Percentage per day</option>
          </SelectControl>
        </div>
        <div className="speed-chart-layout">
          <dl className="speed-legend">
            <div>
              <dt>
                <i className="legend-dot legend-dot--purple" />
                15m Speed
              </dt>
              <dd>
                {formatPercent(data.speeds.fifteenMinutes)} <small>/ 15m</small>
                <ArrowUpRight />
              </dd>
            </div>
            <div>
              <dt>
                <i className="legend-dot legend-dot--blue" />
                1h Speed
              </dt>
              <dd>
                {formatPercent(data.speeds.oneHour)} <small>/ 1h</small>
                <ArrowUpRight />
              </dd>
            </div>
            <div>
              <dt>
                <i className="legend-dot legend-dot--red" />
                24h Speed
              </dt>
              <dd>
                {formatPercent(data.speeds.twentyFourHours)} <small>/ 24h</small>
                <ArrowUpRight />
              </dd>
            </div>
          </dl>
          <SpeedLineChart history={history} />
        </div>
      </Panel>
      <div className="trend-bottom-grid">
        <Panel>
          <SectionTitle info>Current Pace</SectionTitle>
          <QuotaRing quotaWindow={quotaWindow} compact />
        </Panel>
        <Panel>
          <SectionTitle info>Cycle Forecast</SectionTitle>
          <div className="forecast-grid">
            <div>
              <span>Projected Usage</span>
              <strong>{projected}%</strong>
              <small>of quota by reset</small>
            </div>
            <div>
              <span>Projected Remaining</span>
              <strong>{100 - projected}%</strong>
              <small>quota</small>
            </div>
          </div>
          <div className="scenario-row">
            <span>
              At current pace <strong>{projected}%</strong>
            </span>
            <span>
              10% faster <strong className="danger-text">{Math.min(100, projected + 8)}%</strong>
            </span>
            <span>
              10% slower <strong className="success-text">{Math.max(0, projected - 9)}%</strong>
            </span>
          </div>
        </Panel>
        <Panel>
          <SectionTitle info>Window Summary</SectionTitle>
          <dl className="summary-list">
            <div>
              <dt>Window</dt>
              <dd>{formatWindow(quotaWindow.windowMinutes)}</dd>
            </div>
            <div>
              <dt>Used</dt>
              <dd>{formatPercent(quotaWindow.usedPercent)}</dd>
            </div>
            <div>
              <dt>Reset</dt>
              <dd>
                {quotaWindow.resetAt
                  ? new Date(quotaWindow.resetAt * 1000).toLocaleString()
                  : "Unknown"}
              </dd>
            </div>
            <div>
              <dt>Limit ID</dt>
              <dd>{data.snapshot.limitId}</dd>
            </div>
          </dl>
        </Panel>
      </div>
      <p className="timezone-note">
        <ShieldCheck size={17} /> All times shown in your local time zone.
      </p>
    </div>
  );
}
