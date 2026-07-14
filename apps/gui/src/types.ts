export type ThemeMode = "light" | "dark" | "system";
export type RouteId = "overview" | "trends" | "activity" | "alerts" | "settings";

export interface QuotaWindow {
  windowMinutes: number | null;
  usedPercent: number;
  resetAt: number | null;
}

export interface QuotaSnapshot {
  limitId: string;
  limitName: string | null;
  createdAt: number;
  windows: QuotaWindow[];
}

export interface TrendPoint {
  timestamp: number;
  usedPercent: number;
}

export interface UsageSpeeds {
  fifteenMinutes: number;
  oneHour: number;
  twentyFourHours: number;
}

export interface DashboardData {
  snapshot: QuotaSnapshot;
  history: TrendPoint[];
  speeds: UsageSpeeds;
  pace: {
    timeProgress: number;
    usageProgress: number;
    status: "below" | "normal" | "above";
  };
  collector: CollectorState;
}

export interface CollectorState {
  status: "connected" | "connecting" | "offline" | "paused";
  lastUpdateAt: number | null;
  nextPollSeconds: number | null;
}

export interface ActivityEvent {
  id: number;
  createdAt: number;
  eventType:
    | "connected"
    | "disconnected"
    | "reconnected"
    | "quota_decreased"
    | "quota_increased"
    | "quota_reset"
    | "schema_changed";
  title: string;
  message: string;
  delta: number | null;
}

export interface AlertRecord {
  id: number;
  createdAt: number;
  alertType: "rapid_drain" | "collector_offline" | "quota_reset" | "stale_data";
  title: string;
  message: string;
  severity: "high" | "medium" | "info";
  status: "open" | "resolved";
}

export interface AppSettings {
  pollIntervalSeconds: number;
  rapidDrainPercent: number;
  rapidDrainMinutes: number;
  offlineThresholdMinutes: number;
  launchAtLogin: boolean;
  launchMenuBarOnly: boolean;
  desktopNotifications: boolean;
  dailySummary: boolean;
  retentionDays: number;
  theme: ThemeMode;
}

export interface DatabaseStats {
  databaseBytes: number;
  walBytes: number;
  shmBytes: number;
  totalBytes: number;
  reclaimableBytes: number;
}

export interface DatabaseCleanupResult {
  deletedRows: number;
  before: DatabaseStats;
  after: DatabaseStats;
}
