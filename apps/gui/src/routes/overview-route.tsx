import type { DashboardData } from "../types";
import { formatPercent, formatWindow } from "../utils/format";
import { Panel, SectionTitle } from "../components/ui";
import { UsageAreaChart } from "../components/trend-chart";

export function OverviewRoute({ data }: { data: DashboardData }) {
  const quotaWindow = data.snapshot.windows[0];
  if (!quotaWindow)
    return <Panel className="empty-panel">Waiting for the first quota snapshot…</Panel>;
  const remaining = 100 - Math.min(100, Math.max(0, quotaWindow.usedPercent));

  return (
    <div className="overview-page">
      <Panel className="current-remaining-panel">
        <SectionTitle>
          Current Remaining <span>({formatWindow(quotaWindow.windowMinutes)})</span>
        </SectionTitle>
        <div className="current-remaining-value">
          <strong>{formatPercent(remaining)}</strong>
          <span>Remaining</span>
        </div>
      </Panel>
      <Panel className="remaining-trend-panel">
        <SectionTitle>
          Remaining Trend <span>(24h)</span>
        </SectionTitle>
        <UsageAreaChart history={data.history} mode="remaining" />
      </Panel>
    </div>
  );
}
