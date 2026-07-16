import { CalendarBlank, Database } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { getDatabaseStats, saveSettings } from "../api/quota-api";
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
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    setSaved(false);
    void saveSettings(next).then(async (stored) => {
      onSettingsChange(stored);
      setSaved(true);
      if (key === "retentionDays") setStorageStats(await getDatabaseStats());
    });
  };

  return (
    <div className="settings-page">
      <SettingsSection icon={<CalendarBlank />} title="常规">
        <SettingRow title="Codex 路径" description="留空时自动查找 Volta 和常用安装位置">
          <input
            className="path-control"
            type="text"
            aria-label="Codex 可执行文件路径"
            value={draft.codexPath}
            placeholder="~/.volta/bin/codex"
            spellCheck={false}
            onChange={(event) => setDraft({ ...draft, codexPath: event.target.value })}
            onBlur={() => {
              if (draft.codexPath !== settings.codexPath)
                update("codexPath", draft.codexPath.trim());
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
        </SettingRow>
        <SettingRow title="采集频率">
          <SelectControl
            aria-label="采集频率"
            value={draft.pollIntervalSeconds}
            onChange={(event) => update("pollIntervalSeconds", Number(event.target.value))}
          >
            <option value="900">15 分钟</option>
            <option value="1800">30 分钟</option>
            <option value="3600">60 分钟</option>
          </SelectControl>
        </SettingRow>
        <SettingRow title="浮窗趋势范围">
          <SelectControl
            aria-label="浮窗趋势范围"
            value={draft.trayHistoryHours}
            onChange={(event) => update("trayHistoryHours", Number(event.target.value))}
          >
            <option value="24">最近 24 小时</option>
            <option value="168">最近 7 天</option>
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
          <SelectControl
            aria-label="数据保留时间"
            value={draft.retentionDays}
            onChange={(event) => update("retentionDays", Number(event.target.value))}
          >
            <option value="7">7 天</option>
            <option value="14">14 天</option>
            <option value="30">30 天</option>
            <option value="90">90 天</option>
            <option value="0">长期</option>
          </SelectControl>
        </SettingRow>
        <SettingRow title="磁盘占用">
          <div className="storage-size" aria-live="polite">
            <strong>{storageStats ? formatBytes(storageStats.totalBytes) : "读取中…"}</strong>
          </div>
        </SettingRow>
      </SettingsSection>
      <UpdateControl />
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
    <section className="settings-group">
      <h2>
        {icon}
        {title}
      </h2>
      <Panel className="settings-section">{children}</Panel>
    </section>
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
