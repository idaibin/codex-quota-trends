import { ArrowsClockwise } from "@phosphor-icons/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDashboard, getSettings, refreshQuota, saveSettings } from "./api/quota-api";
import { AppShell } from "./components/app-shell";
import { TrayPopover } from "./components/tray-popover";
import { IconButton, SelectControl } from "./components/ui";
import { OverviewRoute } from "./routes/overview-route";
import { SettingsRoute } from "./routes/settings-route";
import type { AppSettings, DashboardData, ThemeMode } from "./types";

type MainRoute = "overview" | "settings";

export default function App() {
  const [route, setRoute] = useState<MainRoute>(() =>
    localStorage.getItem("cqt:requested-route") === "settings" ? "settings" : "overview",
  );
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [windowLabel, setWindowLabel] = useState("main");

  const load = useCallback(async () => {
    try {
      const [dashboardData, settingsData] = await Promise.all([getDashboard(), getSettings()]);
      setDashboard(dashboardData);
      setSettings(settingsData);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }, []);

  useEffect(() => {
    void load();
    if (window.__TAURI_INTERNALS__) setWindowLabel(getCurrentWindow().label);
    const timer = window.setInterval(() => void load(), 5_000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (localStorage.getItem("cqt:requested-route")) localStorage.removeItem("cqt:requested-route");
  }, [route]);

  useEffect(() => {
    const applyRoute = (value: unknown) => {
      setRoute(value === "settings" ? "settings" : "overview");
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "cqt:requested-route") applyRoute(event.newValue);
    };
    const handleRouteRequest = (event: Event) => {
      applyRoute((event as CustomEvent<unknown>).detail);
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("cqt-route-requested", handleRouteRequest);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cqt-route-requested", handleRouteRequest);
    };
  }, []);

  const resolvedTheme = useMemo<Exclude<ThemeMode, "system">>(() => {
    const mode = settings?.theme ?? "system";
    return mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : mode;
  }, [settings?.theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setDashboard(await refreshQuota());
    } finally {
      setRefreshing(false);
    }
  };

  const handleThemeToggle = () => {
    if (!settings) return;
    const next = { ...settings, theme: (resolvedTheme === "dark" ? "light" : "dark") as ThemeMode };
    setSettings(next);
    void saveSettings(next);
  };

  if (!dashboard || !settings)
    return (
      <div className="loading-screen">
        <img src="/app-mark.png" alt="" />
        <strong>Loading local quota history…</strong>
        {error && <span>{error}</span>}
      </div>
    );
  if (
    windowLabel === "tray" ||
    new URLSearchParams(window.location.search).get("surface") === "tray"
  )
    return <TrayPopover data={dashboard} />;

  const toolbar = (
    <>
      {route === "overview" && (
        <SelectControl defaultValue={dashboard.snapshot.limitId}>
          <option value={dashboard.snapshot.limitId}>All Windows</option>
        </SelectControl>
      )}
      <IconButton
        aria-label="Refresh quota"
        disabled={refreshing}
        onClick={() => void handleRefresh()}
      >
        <ArrowsClockwise size={21} />
      </IconButton>
    </>
  );

  return (
    <AppShell
      route={route}
      onRouteChange={setRoute}
      theme={settings.theme}
      onThemeToggle={handleThemeToggle}
      toolbar={toolbar}
    >
      {error && <div className="error-banner">Collector error: {error}</div>}
      {route === "overview" && <OverviewRoute data={dashboard} />}
      {route === "settings" && <SettingsRoute settings={settings} onSettingsChange={setSettings} />}
    </AppShell>
  );
}
