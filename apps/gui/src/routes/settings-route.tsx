import {
  Bell,
  Broom,
  CalendarBlank,
  Database,
  Export,
  FolderOpen,
  Gear,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  cleanupDatabase,
  exportData,
  getDatabaseStats,
  openDataFolder,
  resetLocalData,
  saveSettings,
} from "../api/quota-api";
import type { AppSettings, DatabaseStats } from "../types";
import { formatBytes } from "../utils/format";
import { Panel, SelectControl, Toggle } from "../components/ui";

export function SettingsRoute({
  settings,
  onSettingsChange,
}: {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [storageStats, setStorageStats] = useState<DatabaseStats | null>(null);
  const [storageMessage, setStorageMessage] = useState("");
  const [cleaning, setCleaning] = useState(false);
  useEffect(() => setDraft(settings), [settings]);
  useEffect(() => {
    let cancelled = false;
    void getDatabaseStats()
      .then((stats) => {
        if (!cancelled) setStorageStats(stats);
      })
      .catch(() => {
        if (!cancelled) setStorageMessage("Database size is currently unavailable.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    setSaved(false);
    void saveSettings(next).then((stored) => {
      onSettingsChange(stored);
      setSaved(true);
    });
  };

  const commitRetention = () => {
    const retentionDays = Math.min(365, Math.max(1, Math.round(draft.retentionDays || 30)));
    const next = { ...draft, retentionDays };
    setDraft(next);
    setSaved(false);
    void saveSettings(next).then(async (stored) => {
      onSettingsChange(stored);
      setSaved(true);
      setStorageStats(await getDatabaseStats());
    });
  };

  const cleanDatabase = async () => {
    setCleaning(true);
    setStorageMessage("");
    try {
      const result = await cleanupDatabase();
      setStorageStats(result.after);
      const released = Math.max(0, result.before.totalBytes - result.after.totalBytes);
      setStorageMessage(
        `Database optimized. Removed ${result.deletedRows} expired rows and released ${formatBytes(released)}.`,
      );
    } catch (reason) {
      setStorageMessage(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setCleaning(false);
    }
  };

  const confirmReset = async () => {
    if (
      window.confirm("Delete all local quota history, events, and alerts? This cannot be undone.")
    ) {
      setCleaning(true);
      try {
        const result = await resetLocalData();
        setStorageStats(result.after);
        const released = Math.max(0, result.before.totalBytes - result.after.totalBytes);
        setStorageMessage(
          `Local data reset. Removed ${result.deletedRows} rows and released ${formatBytes(released)}.`,
        );
      } catch (reason) {
        setStorageMessage(reason instanceof Error ? reason.message : String(reason));
      } finally {
        setCleaning(false);
      }
    }
  };

  return (
    <div className="settings-page">
      <SettingsSection icon={<CalendarBlank />} title="Collector">
        <SettingRow title="Polling Interval" description="How often to poll quota data.">
          <SelectControl
            value={draft.pollIntervalSeconds}
            onChange={(event) => update("pollIntervalSeconds", Number(event.target.value))}
          >
            <option value="30">30 seconds</option>
            <option value="60">60 seconds</option>
            <option value="120">2 minutes</option>
          </SelectControl>
        </SettingRow>
        <SettingRow
          title="Start at Login"
          description="Automatically start Codex Quota Trends when you log in."
        >
          <Toggle
            label="Start at login"
            checked={draft.launchAtLogin}
            onChange={(value) => update("launchAtLogin", value)}
          />
        </SettingRow>
        <SettingRow
          title="Launch menu bar only"
          description="Start the app in the menu bar without showing the main window."
        >
          <Toggle
            label="Launch menu bar only"
            checked={draft.launchMenuBarOnly}
            onChange={(value) => update("launchMenuBarOnly", value)}
          />
        </SettingRow>
        <SettingRow
          title="Rapid Usage Threshold"
          description="Trigger an alert when usage increases by this amount within the time window."
        >
          <div className="threshold-control">
            <input
              aria-label="Rapid usage percentage"
              type="number"
              min="1"
              max="100"
              value={draft.rapidDrainPercent}
              onChange={(event) => update("rapidDrainPercent", Number(event.target.value))}
            />
            <span>% in</span>
            <SelectControl
              value={draft.rapidDrainMinutes}
              onChange={(event) => update("rapidDrainMinutes", Number(event.target.value))}
            >
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
            </SelectControl>
          </div>
        </SettingRow>
        <SettingRow
          title="Collector Offline Threshold"
          description="Trigger an alert if the collector has not reported in."
        >
          <SelectControl
            value={draft.offlineThresholdMinutes}
            onChange={(event) => update("offlineThresholdMinutes", Number(event.target.value))}
          >
            <option value="3">3 minutes</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
          </SelectControl>
        </SettingRow>
      </SettingsSection>
      <SettingsSection icon={<Bell />} title="Alerts">
        <SettingRow
          title="Enable Desktop Notifications"
          description="Show system notifications for alerts."
        >
          <Toggle
            label="Desktop notifications"
            checked={draft.desktopNotifications}
            onChange={(value) => update("desktopNotifications", value)}
          />
        </SettingRow>
        <SettingRow title="Daily Summary" description="Send a daily usage summary notification.">
          <Toggle
            label="Daily summary"
            checked={draft.dailySummary}
            onChange={(value) => update("dailySummary", value)}
          />
        </SettingRow>
      </SettingsSection>
      <SettingsSection icon={<Database />} title="Data">
        <SettingRow
          title="Data Retention"
          description="Keep history for this many days. New installs default to 30 days."
        >
          <label className="retention-control">
            <input
              aria-label="Data retention days"
              type="number"
              min="1"
              max="365"
              value={draft.retentionDays}
              onChange={(event) =>
                setDraft({ ...draft, retentionDays: Number(event.target.value) })
              }
              onBlur={commitRetention}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
            />
            <span>days</span>
          </label>
        </SettingRow>
        <SettingRow
          title="Database Size"
          description="SQLite database, write-ahead log, and shared-memory files on disk."
        >
          <div className="storage-size" aria-live="polite">
            <strong>{storageStats ? formatBytes(storageStats.totalBytes) : "Loading…"}</strong>
            {storageStats && (
              <span>
                DB {formatBytes(storageStats.databaseBytes)} · WAL{" "}
                {formatBytes(storageStats.walBytes)}
                {" · "}SHM {formatBytes(storageStats.shmBytes)}
              </span>
            )}
          </div>
        </SettingRow>
        <div className="settings-actions settings-actions--three">
          <button type="button" onClick={() => void cleanDatabase()} disabled={cleaning}>
            <Broom size={23} />
            <span>
              <strong>{cleaning ? "Cleaning…" : "Clean Up Database"}</strong>
              <small>
                {storageStats && storageStats.reclaimableBytes > 0
                  ? `${formatBytes(storageStats.reclaimableBytes)} can be reclaimed.`
                  : "Remove expired rows and compact SQLite."}
              </small>
            </span>
          </button>
          <button type="button" onClick={() => void exportData()}>
            <Export size={23} />
            <span>
              <strong>Export Data…</strong>
              <small>Export your usage data to a CSV file.</small>
            </span>
          </button>
          <button type="button" onClick={() => void openDataFolder()}>
            <FolderOpen size={23} />
            <span>
              <strong>Open Data Folder</strong>
              <small>Open the folder containing local data files.</small>
            </span>
          </button>
        </div>
        {storageMessage && <p className="storage-message">{storageMessage}</p>}
      </SettingsSection>
      <Panel className="danger-zone">
        <div>
          <h2>
            <Gear />
            App
          </h2>
          <strong>Danger Zone</strong>
          <p>Permanently delete all local data. This action cannot be undone.</p>
        </div>
        <button type="button" onClick={() => void confirmReset()} disabled={cleaning}>
          Reset Local Data…
        </button>
      </Panel>
      <div className={`save-indicator ${saved ? "save-indicator--visible" : ""}`}>
        Settings saved
      </div>
    </div>
  );
}

function SettingsSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className="settings-section">
      <h2>
        {icon}
        {title}
      </h2>
      {children}
    </Panel>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="setting-row">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      {children}
    </div>
  );
}
