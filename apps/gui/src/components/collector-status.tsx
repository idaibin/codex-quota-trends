import type { CollectorState } from "../types";
import { formatRelativeTime } from "../utils/format";

const statusLabel: Record<CollectorState["status"], string> = {
  connected: "Connected",
  connecting: "Connecting",
  offline: "Offline",
  paused: "Paused",
};

export function CollectorStatus({
  collector,
  compact = false,
}: {
  collector: CollectorState;
  compact?: boolean;
}) {
  return (
    <div className={`collector-status ${compact ? "collector-status--compact" : ""}`}>
      <div className="collector-status__heading">
        <span className={`status-dot status-dot--${collector.status}`} />
        <strong>Collector</strong>
        <span className={`status-label status-label--${collector.status}`}>
          {statusLabel[collector.status]}
        </span>
      </div>
      <dl>
        <div>
          <dt>Last update</dt>
          <dd>{formatRelativeTime(collector.lastUpdateAt)}</dd>
        </div>
        <div>
          <dt>Next poll</dt>
          <dd>{collector.nextPollSeconds == null ? "—" : `${collector.nextPollSeconds} sec`}</dd>
        </div>
      </dl>
    </div>
  );
}
