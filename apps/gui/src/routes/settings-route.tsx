import {
  Broom,
  CalendarBlank,
  CaretRight,
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
import { UpdateControl } from "../components/update-control";

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
    if (!saved) return undefined;
    const timer = window.setTimeout(() => setSaved(false), 1_600);
    return () => window.clearTimeout(timer);
  }, [saved]);
  useEffect(() => {
    let cancelled = false;
    void getDatabaseStats()
      .then((stats) => {
        if (!cancelled) setStorageStats(stats);
      })
      .catch(() => {
        if (!cancelled) setStorageMessage("暂时无法读取数据库大小");
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
    const retentionDays = Math.min(365, Math.max(1, Math.round(draft.retentionDays || 14)));
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
        `清理完成：删除 ${result.deletedRows} 条过期记录，释放 ${formatBytes(released)}`,
      );
    } catch {
      setStorageMessage("清理失败，请稍后重试");
    } finally {
      setCleaning(false);
    }
  };

  const confirmReset = async () => {
    if (window.confirm("确定清除全部本地额度记录吗？此操作无法撤销。")) {
      setCleaning(true);
      try {
        const result = await resetLocalData();
        setStorageStats(result.after);
        const released = Math.max(0, result.before.totalBytes - result.after.totalBytes);
        setStorageMessage(
          `本地数据已清除：删除 ${result.deletedRows} 条记录，释放 ${formatBytes(released)}`,
        );
      } catch {
        setStorageMessage("清除失败，请稍后重试");
      } finally {
        setCleaning(false);
      }
    }
  };

  return (
    <div className="settings-page">
      <UpdateControl />
      <SettingsSection icon={<CalendarBlank />} title="常规">
        <SettingRow title="采集频率">
          <SelectControl
            aria-label="采集频率"
            value={draft.pollIntervalSeconds}
            onChange={(event) => update("pollIntervalSeconds", Number(event.target.value))}
          >
            <option value="30">30 秒</option>
            <option value="60">1 分钟</option>
            <option value="120">2 分钟</option>
          </SelectControl>
        </SettingRow>
        <SettingRow title="登录时启动">
          <Toggle
            label="登录时启动"
            checked={draft.launchAtLogin}
            onChange={(value) => update("launchAtLogin", value)}
          />
        </SettingRow>
        <SettingRow title="仅显示菜单栏">
          <Toggle
            label="仅显示菜单栏"
            checked={draft.launchMenuBarOnly}
            onChange={(value) => update("launchMenuBarOnly", value)}
          />
        </SettingRow>
        <SettingRow title="主题">
          <SelectControl
            aria-label="主题"
            value={draft.theme}
            onChange={(event) => update("theme", event.target.value as AppSettings["theme"])}
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </SelectControl>
        </SettingRow>
      </SettingsSection>
      <SettingsSection icon={<Database />} title="数据">
        <SettingRow title="保留时间">
          <label className="retention-control">
            <input
              aria-label="数据保留天数"
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
            <span>天</span>
          </label>
        </SettingRow>
        <SettingRow title="磁盘占用">
          <div className="storage-size" aria-live="polite">
            <strong>{storageStats ? formatBytes(storageStats.totalBytes) : "读取中…"}</strong>
            {storageStats && (
              <span>
                数据库 {formatBytes(storageStats.databaseBytes)} · 日志{" "}
                {formatBytes(storageStats.walBytes)} · 临时 {formatBytes(storageStats.shmBytes)}
              </span>
            )}
          </div>
        </SettingRow>
        <div className="settings-actions">
          <button type="button" onClick={() => void cleanDatabase()} disabled={cleaning}>
            <Broom size={23} />
            <span>
              <strong>{cleaning ? "正在清理…" : "清理数据库"}</strong>
              {storageStats && storageStats.reclaimableBytes > 0 && (
                <small>可释放 {formatBytes(storageStats.reclaimableBytes)}</small>
              )}
            </span>
            <CaretRight size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => void exportData()}>
            <Export size={23} />
            <span>
              <strong>导出数据</strong>
            </span>
            <CaretRight size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => void openDataFolder()}>
            <FolderOpen size={23} />
            <span>
              <strong>打开目录</strong>
            </span>
            <CaretRight size={16} aria-hidden="true" />
          </button>
        </div>
        {storageMessage && <p className="storage-message">{storageMessage}</p>}
      </SettingsSection>
      <Panel className="danger-zone">
        <div>
          <strong>
            <Gear /> 清除本地数据
          </strong>
          <p>删除全部记录，无法撤销</p>
        </div>
        <button type="button" onClick={() => void confirmReset()} disabled={cleaning}>
          清除数据
        </button>
      </Panel>
      <div
        className={`save-indicator ${saved ? "save-indicator--visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        已保存
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
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="setting-row">
      <div>
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
      {children}
    </div>
  );
}
