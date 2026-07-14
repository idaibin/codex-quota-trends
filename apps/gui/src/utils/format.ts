export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatBytes(value: number): string {
  if (value < 1_024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let amount = value / 1_024;
  let unit = units[0];
  for (const candidate of units.slice(1)) {
    if (amount < 1_024) break;
    amount /= 1_024;
    unit = candidate;
  }
  const precision = amount >= 100 ? 0 : amount >= 10 ? 1 : 2;
  return `${amount.toFixed(precision)} ${unit}`;
}

export function formatRelativeTime(timestamp: number | null, now = Date.now() / 1000): string {
  if (!timestamp) return "Not yet";
  const seconds = Math.max(0, now - timestamp);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

export function formatResetDuration(resetAt: number | null, now = Date.now() / 1000): string {
  if (!resetAt) return "Unknown";
  const minutes = Math.max(0, Math.floor((resetAt - now) / 60));
  const days = Math.floor(minutes / 1_440);
  const hours = Math.floor((minutes % 1_440) / 60);
  const remainder = minutes % 60;
  return days > 0 ? `${days}d ${hours}h ${remainder}m` : `${hours}h ${remainder}m`;
}

export function formatWindow(windowMinutes: number | null): string {
  if (!windowMinutes) return "Quota";
  if (windowMinutes % 10_080 === 0)
    return `${windowMinutes / 10_080} Week${windowMinutes === 10_080 ? "" : "s"}`;
  if (windowMinutes % 1_440 === 0)
    return `${windowMinutes / 1_440} Day${windowMinutes === 1_440 ? "" : "s"}`;
  if (windowMinutes % 60 === 0)
    return `${windowMinutes / 60} Hour${windowMinutes === 60 ? "" : "s"}`;
  return `${windowMinutes} Minutes`;
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp * 1000));
}

export function formatChartTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp * 1000));
}
