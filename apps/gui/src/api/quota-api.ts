import { invoke } from "@tauri-apps/api/core";
import {
  demoActivity,
  demoAlerts,
  demoDashboard,
  demoDatabaseStats,
  demoSettings,
} from "../data/demo-data";
import type {
  ActivityEvent,
  AlertRecord,
  AppSettings,
  DashboardData,
  DatabaseCleanupResult,
  DatabaseStats,
} from "../types";

export const isTauriRuntime = () => Boolean(window.__TAURI_INTERNALS__);

export async function getDashboard(): Promise<DashboardData> {
  return isTauriRuntime() ? invoke<DashboardData>("get_dashboard") : structuredClone(demoDashboard);
}

export async function getActivity(): Promise<ActivityEvent[]> {
  return isTauriRuntime() ? invoke<ActivityEvent[]>("get_activity") : structuredClone(demoActivity);
}

export async function getAlerts(): Promise<AlertRecord[]> {
  return isTauriRuntime() ? invoke<AlertRecord[]>("get_alerts") : structuredClone(demoAlerts);
}

export async function getSettings(): Promise<AppSettings> {
  return isTauriRuntime() ? invoke<AppSettings>("get_settings") : structuredClone(demoSettings);
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  if (isTauriRuntime()) return invoke<AppSettings>("save_settings", { settings });
  Object.assign(demoSettings, settings);
  return structuredClone(demoSettings);
}

export async function refreshQuota(): Promise<DashboardData> {
  return isTauriRuntime() ? invoke<DashboardData>("refresh_quota") : structuredClone(demoDashboard);
}

export async function exportData(): Promise<string | null> {
  return isTauriRuntime() ? invoke<string | null>("export_data") : null;
}

export async function openDataFolder(): Promise<void> {
  if (isTauriRuntime()) await invoke("open_data_folder");
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  return isTauriRuntime()
    ? invoke<DatabaseStats>("get_database_stats")
    : structuredClone(demoDatabaseStats);
}

export async function cleanupDatabase(): Promise<DatabaseCleanupResult> {
  if (isTauriRuntime()) return invoke<DatabaseCleanupResult>("cleanup_database");
  const before = structuredClone(demoDatabaseStats);
  Object.assign(demoDatabaseStats, {
    walBytes: 0,
    totalBytes: demoDatabaseStats.databaseBytes + demoDatabaseStats.shmBytes,
    reclaimableBytes: 0,
  });
  return { deletedRows: 12, before, after: structuredClone(demoDatabaseStats) };
}

export async function resetLocalData(): Promise<DatabaseCleanupResult> {
  if (isTauriRuntime()) return invoke<DatabaseCleanupResult>("reset_local_data");
  const before = structuredClone(demoDatabaseStats);
  Object.assign(demoDatabaseStats, {
    databaseBytes: 73_728,
    walBytes: 0,
    totalBytes: 106_496,
    reclaimableBytes: 0,
  });
  return { deletedRows: 248, before, after: structuredClone(demoDatabaseStats) };
}
