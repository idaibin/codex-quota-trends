import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "../types";
import { formatChartTime, formatPercent } from "../utils/format";

const normalize = (history: TrendPoint[]) =>
  history.map((point) => ({ ...point, label: formatChartTime(point.timestamp) }));

const formatTrayDate = (timestamp: number) =>
  new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(
    new Date(timestamp * 1_000),
  );

const formatTrayTime = (timestamp: number) =>
  new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(timestamp * 1_000),
  );

export function UsageAreaChart({
  history,
  compact = false,
  mode = "used",
}: {
  history: TrendPoint[];
  compact?: boolean;
  mode?: "used" | "remaining";
}) {
  const data = normalize(history).map((point) => ({
    ...point,
    remainingPercent: 100 - point.usedPercent,
  }));
  const isRemaining = mode === "remaining";
  return (
    <div
      className={compact ? "chart chart--compact" : "chart"}
      aria-label={`Quota ${isRemaining ? "remaining" : "usage"} over time`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 6, bottom: 0, left: compact ? -30 : -6 }}>
          {!compact && (
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
          )}
          {!compact && (
            <YAxis
              domain={[0, 100]}
              tickFormatter={formatPercent}
              tickLine={false}
              axisLine={false}
              width={54}
            />
          )}
          {!compact && (
            <XAxis
              dataKey="label"
              minTickGap={52}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
            />
          )}
          {!compact && (
            <Tooltip
              formatter={(value) => formatPercent(Number(value))}
              labelStyle={{ color: "var(--text)" }}
              contentStyle={{
                background: "var(--panel)",
                borderColor: "var(--border)",
                borderRadius: 12,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey={isRemaining ? "remainingPercent" : "usedPercent"}
            stroke="var(--accent)"
            fill="var(--chart-fill)"
            strokeWidth={compact ? 3 : 2.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrayRemainingChart({ history }: { history: TrendPoint[] }) {
  const sevenDaysAgo = Date.now() / 1_000 - 7 * 24 * 60 * 60;
  const recentHistory = history.filter((point) => point.timestamp >= sevenDaysAgo);
  const source = recentHistory.length > 1 ? recentHistory : history;
  const labelIndexes = new Set([0, Math.floor((source.length - 1) / 2), source.length - 1]);
  const data = source.map((point, index) => {
    const remainingPercent = 100 - point.usedPercent;
    return {
      ...point,
      remainingPercent,
      displayPercent: labelIndexes.has(index) ? formatPercent(remainingPercent) : undefined,
    };
  });
  if (data.length === 0)
    return <div className="tray-trend-chart tray-trend-chart--empty">暂无趋势数据</div>;
  const values = data.map((point) => point.remainingPercent);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const domainMin = Math.max(0, Math.floor((minimum - 4) / 5) * 5);
  const domainMax = Math.min(100, Math.ceil((maximum + 4) / 5) * 5);
  const last = data.at(-1);
  const timeSpan = last && data[0] ? last.timestamp - data[0].timestamp : 0;
  const formatTick = timeSpan >= 2 * 86_400 ? formatTrayDate : formatTrayTime;

  return (
    <div
      className="tray-trend-chart"
      aria-label={`最近${timeSpan >= 2 * 86_400 ? "七天" : "24小时"}的剩余额度`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 22, right: 20, bottom: 1, left: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
          <YAxis
            domain={[domainMin, domainMax]}
            tickCount={3}
            tickFormatter={formatPercent}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <XAxis
            dataKey="timestamp"
            tickCount={3}
            tickFormatter={formatTick}
            tickLine={false}
            axisLine={false}
            minTickGap={64}
            height={18}
            tickMargin={3}
          />
          <Tooltip
            formatter={(value) => [formatPercent(Number(value)), "剩余额度"]}
            labelFormatter={(value) =>
              new Intl.DateTimeFormat("zh-CN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(Number(value) * 1_000))
            }
            cursor={{ stroke: "var(--accent-mid)", strokeDasharray: "3 3" }}
            contentStyle={{
              background: "var(--panel)",
              border: "1px solid var(--border-strong)",
              borderRadius: 10,
              boxShadow: "0 10px 28px rgba(15, 23, 42, 0.12)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotoneX"
            dataKey="remainingPercent"
            stroke="var(--accent)"
            fill="var(--chart-fill)"
            fillOpacity={0.72}
            strokeWidth={2.75}
            dot={false}
            activeDot={{ r: 4, fill: "var(--accent)", stroke: "var(--panel)", strokeWidth: 2 }}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="displayPercent"
              position="top"
              offset={7}
              fill="var(--text)"
              fontSize={10}
              fontWeight={650}
            />
          </Area>
          {last && (
            <ReferenceDot
              x={last.timestamp}
              y={last.remainingPercent}
              r={4}
              fill="var(--accent)"
              stroke="var(--panel)"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SpeedLineChart({ history }: { history: TrendPoint[] }) {
  const data = normalize(history).map((point, index) => ({
    ...point,
    fifteenMinutes: Math.max(0, point.usedPercent * 0.05 + Math.sin(index / 2) * 0.15),
    oneHour: Math.max(0, point.usedPercent * 0.09 + Math.sin(index / 4) * 0.2),
    twentyFourHours: Math.max(0, point.usedPercent * 0.2 + Math.sin(index / 8) * 0.25),
  }));
  return (
    <div className="chart chart--speed" aria-label="Usage speed over time">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -6 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
          <YAxis
            domain={[0, 20]}
            tickFormatter={formatPercent}
            tickLine={false}
            axisLine={false}
            width={54}
          />
          <XAxis
            dataKey="label"
            minTickGap={52}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <Tooltip
            formatter={(value) => formatPercent(Number(value))}
            contentStyle={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              borderRadius: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="fifteenMinutes"
            stroke="#5b3df5"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="oneHour"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="twentyFourHours"
            stroke="#ff4545"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
