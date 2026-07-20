import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "../types";
import { formatChartTime, formatPercent } from "../utils/format";

const normalize = (history: TrendPoint[]) =>
  history.map((point) => ({ ...point, label: formatChartTime(point.timestamp) }));

const RESET_JUMP_THRESHOLD = 20;
const TRAY_WINDOW_SECONDS = 24 * 60 * 60;
const TRAY_POINT_LIMIT = 100;

interface TrayTrendDatum extends TrendPoint {
  remainingPercent: number;
  sourceIndex: number;
  resetBoundary: boolean;
}

export function buildResetAwareTrayHistory(history: TrendPoint[]): {
  data: TrayTrendDatum[];
  hasReset: boolean;
} {
  const source = [...history]
    .sort((left, right) => left.timestamp - right.timestamp)
    .map((point, sourceIndex) => ({
      ...point,
      remainingPercent: 100 - point.usedPercent,
      sourceIndex,
      resetBoundary: false,
    }));
  const data: TrayTrendDatum[] = [];
  let hasReset = false;

  source.forEach((point, index) => {
    const previous = source[index - 1];
    if (previous && point.remainingPercent - previous.remainingPercent >= RESET_JUMP_THRESHOLD) {
      hasReset = true;
      data.push({
        ...point,
        usedPercent: previous.usedPercent,
        remainingPercent: previous.remainingPercent,
        resetBoundary: true,
      });
    }
    data.push(point);
  });

  return { data, hasReset };
}

export function buildAvailablePercentScale(history: Array<{ remainingPercent: number }>): {
  domain: [number, number];
  ticks: number[];
} {
  const values = history.map((point) => point.remainingPercent);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = Math.max(1, (maximum - minimum) * 0.2);
  const domain: [number, number] = [
    Math.max(0, Math.floor(minimum - padding)),
    Math.min(100, Math.ceil(maximum + padding)),
  ];
  const availableTicks = Array.from(new Set(values.map(Math.round))).sort(
    (left, right) => left - right,
  );
  const ticks =
    availableTicks.length <= 3
      ? availableTicks
      : [
          availableTicks[0],
          availableTicks[Math.floor(availableTicks.length / 2)],
          availableTicks.at(-1)!,
        ];

  return { domain, ticks };
}

export function selectTrayChangeHistory(history: TrendPoint[]): TrendPoint[] {
  const source = [...history].sort((left, right) => left.timestamp - right.timestamp);
  const changed = source.filter(
    (point, index) => index === 0 || point.usedPercent !== source[index - 1]?.usedPercent,
  );
  return changed.slice(-TRAY_POINT_LIMIT);
}

export function buildTrayChartData(history: TrendPoint[]): TrayTrendDatum[] {
  const source = selectTrayChangeHistory(history);
  return buildResetAwareTrayHistory(source).data.slice(-TRAY_POINT_LIMIT);
}

export function countQuotaResets(history: TrendPoint[]): number {
  const source = [...history].sort((left, right) => left.timestamp - right.timestamp);
  const lastTimestamp = source.at(-1)?.timestamp ?? 0;
  const firstTimestamp = lastTimestamp - TRAY_WINDOW_SECONDS;

  return source.reduce((count, point, index) => {
    const previous = source[index - 1];
    return previous &&
      point.timestamp >= firstTimestamp &&
      previous.usedPercent - point.usedPercent >= RESET_JUMP_THRESHOLD
      ? count + 1
      : count;
  }, 0);
}

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

export function TrayRemainingChart({
  history,
  compact = false,
}: {
  history: TrendPoint[];
  compact?: boolean;
}) {
  const data = buildTrayChartData(history);
  if (data.length === 0)
    return <div className="tray-trend-chart tray-trend-chart--empty">暂无趋势数据</div>;
  const firstChangeIndex = data[0].sourceIndex;
  const lastChangeIndex = data.at(-1)?.sourceIndex ?? firstChangeIndex;
  const percentScale = buildAvailablePercentScale(data);
  const last = data.at(-1);
  const resetPoints = data.filter(
    (point, index) =>
      !point.resetBoundary &&
      data[index - 1]?.resetBoundary &&
      data[index - 1]?.timestamp === point.timestamp,
  );
  const latestReset = resetPoints.at(-1);
  const resetLabel = latestReset
    ? `重置 ${new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(latestReset.timestamp * 1_000))}`
    : null;

  return (
    <div className="tray-trend-chart" aria-label="所选时间范围内的剩余额度">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={
            compact
              ? { top: 4, right: 8, bottom: 0, left: 0 }
              : { top: 26, right: 2, bottom: 2, left: 0 }
          }
        >
          <CartesianGrid
            stroke="var(--tray-chart-grid)"
            strokeDasharray="2 5"
            strokeOpacity={0.68}
            vertical={false}
          />
          <YAxis
            domain={percentScale.domain}
            ticks={percentScale.ticks}
            tickFormatter={formatPercent}
            tickLine={false}
            axisLine={false}
            width={compact ? 28 : 40}
            tick={{ fill: "var(--tray-text)", fontSize: compact ? 8 : 11, fontWeight: 450 }}
          />
          <XAxis
            hide
            dataKey="sourceIndex"
            type="number"
            scale="linear"
            domain={[firstChangeIndex, lastChangeIndex]}
            height={0}
          />
          <Tooltip
            formatter={(value) => [formatPercent(Number(value)), "剩余额度"]}
            labelFormatter={(_, payload) => {
              const timestamp = Number(payload?.[0]?.payload?.timestamp);
              return new Intl.DateTimeFormat("zh-CN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(timestamp * 1_000));
            }}
            cursor={false}
            contentStyle={{
              background: "var(--tray-tooltip)",
              border: "1px solid var(--tray-border)",
              borderRadius: compact ? 6 : 9,
              boxShadow: "0 10px 28px rgba(0, 0, 0, 0.22)",
              fontSize: compact ? 9 : 12,
            }}
          />
          <Line
            type="stepAfter"
            dataKey="remainingPercent"
            stroke="var(--tray-chart-line)"
            strokeWidth={compact ? 1 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
            activeDot={{
              r: compact ? 3 : 4,
              fill: "var(--tray-chart-line)",
              stroke: "var(--tray-tooltip)",
              strokeWidth: compact ? 1 : 1.5,
            }}
            isAnimationActive={false}
          />
          {latestReset && resetLabel && (
            <ReferenceLine
              x={latestReset.sourceIndex}
              stroke="var(--tray-reset-line)"
              strokeDasharray="3 4"
              label={{
                value: resetLabel,
                position: "top",
                offset: compact ? 4 : 8,
                fill: "var(--tray-accent)",
                fontSize: compact ? 8 : 11,
                fontWeight: 500,
              }}
            />
          )}
          {last && (
            <>
              <ReferenceDot
                x={last.sourceIndex}
                y={last.remainingPercent}
                r={compact ? 5 : 8}
                fill="var(--tray-current-halo)"
                stroke="none"
              />
              <ReferenceDot
                x={last.sourceIndex}
                y={last.remainingPercent}
                r={compact ? 3 : 4.5}
                fill="var(--tray-chart-line)"
                stroke="var(--tray-tooltip)"
                strokeWidth={compact ? 1 : 1.5}
                label={{
                  value: formatPercent(last.remainingPercent),
                  position: "left",
                  offset: compact ? 6 : 8,
                  fill: "var(--tray-text)",
                  fontSize: compact ? 10 : 12,
                  fontWeight: 650,
                }}
              />
            </>
          )}
        </LineChart>
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
