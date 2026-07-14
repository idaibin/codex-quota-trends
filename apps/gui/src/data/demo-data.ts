import type {
  ActivityEvent,
  AlertRecord,
  AppSettings,
  DashboardData,
  DatabaseStats,
  TrendPoint,
} from "../types";

const now = Math.floor(Date.now() / 1000);

export const demoHistory: TrendPoint[] = Array.from({ length: 49 }, (_, index) => {
  const hour = index / 2;
  const curve = 26 + hour * 0.25 + Math.sin(index / 3) * 0.4;
  return {
    timestamp: now - (48 - index) * 1_800,
    usedPercent: Number(Math.min(82, curve).toFixed(1)),
  };
});

export const demoDashboard: DashboardData = {
  snapshot: {
    limitId: "codex",
    limitName: "Weekly",
    createdAt: now - 60,
    windows: [
      {
        windowMinutes: 10_080,
        usedPercent: 32,
        resetAt: now + 6 * 86_400 + 18 * 3_600 + 42 * 60,
      },
      {
        windowMinutes: 300,
        usedPercent: 18,
        resetAt: now + 2 * 3_600,
      },
    ],
  },
  history: demoHistory,
  speeds: { fifteenMinutes: 1.2, oneHour: 4.8, twentyFourHours: 15.3 },
  pace: { timeProgress: 40, usageProgress: 65, status: "above" },
  collector: { status: "connected", lastUpdateAt: now - 60, nextPollSeconds: 58 },
};

const activityRows: Omit<ActivityEvent, "id" | "createdAt">[] = [
  {
    eventType: "quota_decreased",
    title: "Quota decreased",
    message: "Weekly window 36% → 32%",
    delta: -4,
  },
  {
    eventType: "quota_decreased",
    title: "Quota decreased",
    message: "Weekly window 32% → 31%",
    delta: -1,
  },
  {
    eventType: "reconnected",
    title: "Collector reconnected",
    message: "Connection restored",
    delta: null,
  },
  {
    eventType: "disconnected",
    title: "Connection lost",
    message: "Attempting to reconnect",
    delta: null,
  },
  { eventType: "quota_reset", title: "Quota reset", message: "Weekly window reset", delta: null },
  {
    eventType: "quota_decreased",
    title: "Quota decreased",
    message: "Weekly window 45% → 40%",
    delta: -5,
  },
  {
    eventType: "quota_increased",
    title: "Quota increased",
    message: "Weekly window 55% → 60%",
    delta: 5,
  },
  {
    eventType: "schema_changed",
    title: "Schema changed",
    message: "A new quota window was detected",
    delta: null,
  },
];

export const demoActivity: ActivityEvent[] = activityRows.map((row, index) => ({
  ...row,
  id: index + 1,
  createdAt: now - index * 3_540,
}));

export const demoAlerts: AlertRecord[] = [
  {
    id: 1,
    createdAt: now - 120,
    alertType: "rapid_drain",
    title: "Rapid Usage Detected",
    message: "Usage increased by 5.2% in the last 10 minutes",
    severity: "high",
    status: "open",
  },
  {
    id: 2,
    createdAt: now - 420,
    alertType: "collector_offline",
    title: "Collector Disconnected",
    message: "Collector has been offline for 5 minutes",
    severity: "medium",
    status: "open",
  },
  {
    id: 3,
    createdAt: now - 3_600,
    alertType: "quota_reset",
    title: "Quota Reset",
    message: "Weekly quota has reset",
    severity: "info",
    status: "resolved",
  },
  {
    id: 4,
    createdAt: now - 10_800,
    alertType: "stale_data",
    title: "Stale Data",
    message: "No quota update received recently",
    severity: "medium",
    status: "open",
  },
];

export const demoSettings: AppSettings = {
  pollIntervalSeconds: 60,
  rapidDrainPercent: 5,
  rapidDrainMinutes: 10,
  offlineThresholdMinutes: 5,
  launchAtLogin: true,
  launchMenuBarOnly: false,
  desktopNotifications: false,
  dailySummary: false,
  retentionDays: 14,
  theme: "light",
};

export const demoDatabaseStats: DatabaseStats = {
  databaseBytes: 1_572_864,
  walBytes: 196_608,
  shmBytes: 32_768,
  totalBytes: 1_802_240,
  reclaimableBytes: 245_760,
};
