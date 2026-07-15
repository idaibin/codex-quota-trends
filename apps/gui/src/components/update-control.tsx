import {
  ArrowClockwise,
  CheckCircle,
  DownloadSimple,
  SpinnerGap,
  WarningCircle,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { checkForUpdate, getAppVersion, installUpdate, restartApp } from "../api/quota-api";

type UpdateState = "idle" | "checking" | "latest" | "available" | "installing" | "ready" | "error";

export function UpdateControl() {
  const [state, setState] = useState<UpdateState>("idle");
  const [currentVersion, setCurrentVersion] = useState("…");
  const [targetVersion, setTargetVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAppVersion()
      .then((version) => {
        if (!cancelled) setCurrentVersion(version);
      })
      .catch(() => {
        if (!cancelled) setCurrentVersion("未知");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAction = async () => {
    if (state === "ready") {
      await restartApp();
      return;
    }
    if (state === "available") {
      setState("installing");
      try {
        const result = await installUpdate();
        setTargetVersion(result.targetVersion);
        setState(result.installed ? "ready" : "latest");
      } catch {
        setState("error");
      }
      return;
    }

    setState("checking");
    try {
      const result = await checkForUpdate();
      setCurrentVersion(result.currentVersion);
      setTargetVersion(result.targetVersion);
      setState(result.available ? "available" : "latest");
    } catch {
      setState("error");
    }
  };

  const busy = state === "checking" || state === "installing";
  const label =
    state === "checking"
      ? "检查中"
      : state === "installing"
        ? "安装中"
        : state === "available"
          ? `更新至 ${targetVersion ?? "新版本"}`
          : state === "ready"
            ? "重新启动"
            : state === "latest"
              ? "已是最新"
              : state === "error"
                ? "重试"
                : "检查更新";
  const Icon = busy
    ? SpinnerGap
    : state === "available"
      ? DownloadSimple
      : state === "latest" || state === "ready"
        ? CheckCircle
        : state === "error"
          ? WarningCircle
          : ArrowClockwise;

  return (
    <div className="settings-update-control" data-state={state} aria-live="polite">
      <span>v{currentVersion}</span>
      <button type="button" onClick={() => void handleAction()} disabled={busy}>
        <Icon className={busy ? "spin" : undefined} size={14} aria-hidden="true" />
        {label}
      </button>
    </div>
  );
}
