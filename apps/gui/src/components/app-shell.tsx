import { Bell, ChartLineUp, FileText, Gear, House, Moon, Sun } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { CollectorState, RouteId, ThemeMode } from "../types";
import { CollectorStatus } from "./collector-status";

const navigation: { id: RouteId; label: string; icon: typeof House }[] = [
  { id: "overview", label: "Overview", icon: House },
  { id: "trends", label: "Trends", icon: ChartLineUp },
  { id: "activity", label: "Activity", icon: FileText },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "settings", label: "Settings", icon: Gear },
];

export function AppShell({
  route,
  onRouteChange,
  collector,
  theme,
  onThemeToggle,
  toolbar,
  children,
}: {
  route: RouteId;
  onRouteChange: (route: RouteId) => void;
  collector: CollectorState;
  theme: ThemeMode;
  onThemeToggle: () => void;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const title = navigation.find((item) => item.id === route)?.label ?? "Overview";
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="traffic-lights" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="brand">
          <img src="/app-mark.png" alt="" />
          <span>Codex Quota Trends</span>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={route === id ? "page" : undefined}
              onClick={() => onRouteChange(id)}
            >
              <Icon size={25} weight={route === id ? "duotone" : "regular"} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <CollectorStatus collector={collector} compact />
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="topbar__actions">
            {toolbar}
            <button
              className="icon-button theme-button"
              type="button"
              aria-label="Toggle theme"
              onClick={onThemeToggle}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
