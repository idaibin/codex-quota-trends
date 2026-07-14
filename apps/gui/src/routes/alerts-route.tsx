import {
  Bell,
  CaretRight,
  Clock,
  Info,
  ShieldCheck,
  TrendUp,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { AlertRecord } from "../types";
import { formatDateTime, formatRelativeTime } from "../utils/format";
import { Panel, SelectControl } from "../components/ui";

const alertIcons = {
  rapid_drain: TrendUp,
  collector_offline: WarningCircle,
  quota_reset: Info,
  stale_data: Clock,
};

export function AlertsRoute({ alerts }: { alerts: AlertRecord[] }) {
  const [severity, setSeverity] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const filtered = useMemo(
    () => (severity === "all" ? alerts : alerts.filter((alert) => alert.severity === severity)),
    [alerts, severity],
  );
  const open = alerts.filter((alert) => alert.status === "open");
  const last = alerts[0];

  return (
    <div className="alerts-page">
      <div className="page-filters">
        <SelectControl value={severity} onChange={(event) => setSeverity(event.target.value)}>
          <option value="all">All Severity</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="info">Info</option>
        </SelectControl>
        <SelectControl defaultValue="24h">
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </SelectControl>
      </div>
      <div className="alert-summary-grid">
        <Summary
          icon={<Bell />}
          tone="danger"
          label="Open Alerts"
          value={String(open.length)}
          detail={`${open.filter((a) => a.severity === "high").length} high · ${open.filter((a) => a.severity === "medium").length} medium`}
        />
        <Summary
          icon={<Clock />}
          tone="accent"
          label="Last Alert"
          value={last ? formatRelativeTime(last.createdAt) : "None"}
          detail={last?.title ?? "No alerts recorded"}
        />
        <Summary
          icon={<ShieldCheck />}
          tone="info"
          label="Alert Rules"
          value="4"
          detail="4 enabled · 0 disabled"
        />
      </div>
      <Panel className="alerts-list-panel">
        <div className="alert-list-header">
          <span>Alert</span>
          <span>Severity</span>
          <span>Time</span>
          <span>Status</span>
          <span />
        </div>
        {filtered.map((alert) => {
          const Icon = alertIcons[alert.alertType];
          return (
            <button
              type="button"
              className="alert-row"
              key={alert.id}
              aria-expanded={expanded === alert.id}
              onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}
            >
              <span className={`alert-kind-icon alert-kind-icon--${alert.severity}`}>
                <Icon size={26} />
              </span>
              <span className="alert-copy">
                <strong>{alert.title}</strong>
                <span>{alert.message}</span>
                {expanded === alert.id && (
                  <small>
                    Detected from locally stored quota snapshots. No data left this Mac.
                  </small>
                )}
              </span>
              <span className={`severity-pill severity-pill--${alert.severity}`}>
                {alert.severity[0].toUpperCase() + alert.severity.slice(1)}
              </span>
              <span className="alert-time">
                <strong>{formatRelativeTime(alert.createdAt)}</strong>
                <span>{formatDateTime(alert.createdAt)}</span>
              </span>
              <span className="alert-status">
                <i
                  className={`event-dot event-dot--${alert.status === "open" ? (alert.severity === "high" ? "danger" : "warning") : "info"}`}
                />
                {alert.status[0].toUpperCase() + alert.status.slice(1)}
              </span>
              <CaretRight className={expanded === alert.id ? "rotate" : ""} size={22} />
            </button>
          );
        })}
        <div className="table-footer">
          <span>
            Showing 1–{filtered.length} of {filtered.length} alerts
          </span>
          <div className="pagination">
            <button disabled type="button">
              ‹
            </button>
            <button aria-current="page" type="button">
              1
            </button>
            <button disabled type="button">
              ›
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Summary({
  icon,
  tone,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Panel className="alert-summary">
      <span className={`stat-icon stat-icon--${tone}`}>{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </Panel>
  );
}
