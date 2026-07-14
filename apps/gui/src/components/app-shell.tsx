import { Gear, Moon, Sun } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { ThemeMode } from "../types";

type MainRoute = "overview" | "settings";

export function AppShell({
  route,
  onRouteChange,
  theme,
  onThemeToggle,
  toolbar,
  children,
}: {
  route: MainRoute;
  onRouteChange: (route: MainRoute) => void;
  theme: ThemeMode;
  onThemeToggle: () => void;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const title = route === "settings" ? "设置" : "概览";
  return (
    <div className="app-frame">
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar__leading">
            <div className="traffic-lights" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <button
              className="topbar__brand"
              type="button"
              aria-label="打开概览"
              onClick={() => onRouteChange("overview")}
            >
              <img src="/app-mark.png" alt="" />
            </button>
            <h1>{title}</h1>
          </div>
          <div className="topbar__actions">
            {toolbar}
            <button
              className="icon-button theme-button"
              type="button"
              aria-label="切换主题"
              onClick={onThemeToggle}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {route !== "settings" && (
              <button
                className="icon-button settings-button"
                type="button"
                aria-label="打开设置"
                onClick={() => onRouteChange("settings")}
              >
                <Gear size={20} />
              </button>
            )}
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
