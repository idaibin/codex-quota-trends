import { ArrowDown, ArrowUp, ArrowsClockwise, CheckCircle, Pulse } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { ActivityEvent } from "../types";
import { formatDateTime } from "../utils/format";
import { Panel, SelectControl } from "../components/ui";

function eventTone(event: ActivityEvent): string {
  if (event.eventType === "quota_decreased") return "danger";
  if (
    event.eventType === "quota_increased" ||
    event.eventType === "connected" ||
    event.eventType === "reconnected"
  )
    return "success";
  if (event.eventType === "disconnected") return "warning";
  return "info";
}

export function ActivityRoute({ events }: { events: ActivityEvent[] }) {
  const [eventFilter, setEventFilter] = useState("all");
  const filtered = useMemo(
    () =>
      eventFilter === "all"
        ? events
        : events.filter((event) => event.eventType.includes(eventFilter)),
    [eventFilter, events],
  );
  const decreases = events.filter((event) => event.eventType === "quota_decreased").length;
  const increases = events.filter((event) => event.eventType === "quota_increased").length;
  const connections = events.filter(
    (event) => event.eventType === "connected" || event.eventType === "reconnected",
  ).length;
  const resets = events.filter((event) => event.eventType === "quota_reset").length;

  return (
    <div className="activity-page">
      <div className="page-filters">
        <SelectControl defaultValue="all">
          <option value="all">All Windows</option>
        </SelectControl>
        <SelectControl value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
          <option value="all">All Events</option>
          <option value="quota">Quota Events</option>
          <option value="connect">Connection Events</option>
        </SelectControl>
      </div>
      <div className="stat-card-grid stat-card-grid--five">
        <Stat icon={<Pulse />} tone="accent" value={events.length} label="Total Events" />
        <Stat icon={<CheckCircle />} tone="success" value={connections} label="Connections" />
        <Stat icon={<ArrowDown />} tone="danger" value={decreases} label="Quota Decreases" />
        <Stat icon={<ArrowUp />} tone="info" value={increases} label="Quota Increases" />
        <Stat icon={<ArrowsClockwise />} tone="neutral" value={resets} label="Resets" />
      </div>
      <Panel className="table-panel">
        <div className="activity-table activity-table--header">
          <span>Time</span>
          <span>Event</span>
          <span>Description</span>
          <span>Delta</span>
        </div>
        {filtered.map((event) => (
          <div className="activity-table" key={event.id}>
            <span className="event-time">
              <i className={`event-dot event-dot--${eventTone(event)}`} />
              {formatDateTime(event.createdAt)}
            </span>
            <strong>{event.title}</strong>
            <span>{event.message}</span>
            <b className={`delta delta--${eventTone(event)}`}>
              {event.eventType === "quota_reset"
                ? "Reset"
                : event.delta == null
                  ? "—"
                  : `${event.delta > 0 ? "+" : ""}${event.delta}%`}
            </b>
          </div>
        ))}
        <div className="table-footer">
          <span>
            1–{filtered.length} of {filtered.length} events
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

function Stat({
  icon,
  tone,
  value,
  label,
}: {
  icon: React.ReactNode;
  tone: string;
  value: number;
  label: string;
}) {
  return (
    <Panel className="stat-card">
      <span className={`stat-icon stat-icon--${tone}`}>{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        <small>Last 7 days</small>
      </div>
    </Panel>
  );
}
