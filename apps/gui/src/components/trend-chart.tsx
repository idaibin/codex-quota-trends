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
import type { XAxisTickContentProps } from "recharts";
import type { TrendPoint } from "../types";
import { formatChartTime, formatPercent } from "../utils/format";

const normalize = (history: TrendPoint[]) =>
  history.map((point) => ({ ...point, label: formatChartTime(point.timestamp) }));

const formatTrayTime = (timestamp: number, showTime: boolean) =>
  new Intl.DateTimeFormat(
    "zh-CN",
    showTime
      ? { hour: "2-digit", minute: "2-digit", hour12: false }
      : { month: "numeric", day: "numeric" },
  ).format(new Date(timestamp * 1_000));

const RESET_JUMP_THRESHOLD = 20;
const TRAY_WINDOW_SECONDS = 24 * 60 * 60;
const TRAY_POINT_LIMIT = 300;
const TRAY_BUCKET_SECONDS = 5 * 60;

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

export function buildContinuousTimeTicks(firstTimestamp: number, lastTimestamp: number): number[] {
  return Array.from(
    new Set([firstTimestamp, firstTimestamp + (lastTimestamp - firstTimestamp) / 2, lastTimestamp]),
  );
}

export function downsampleTrayHistory(history: TrendPoint[]): TrendPoint[] {
  const source = [...history].sort((left, right) => left.timestamp - right.timestamp);
  if (source.length <= TRAY_POINT_LIMIT) return source;

  const importantIndexes = new Set([0, source.length - 1]);
  let minimumRemainingIndex = 0;
  source.forEach((point, index) => {
    if (point.usedPercent > source[minimumRemainingIndex].usedPercent) {
      minimumRemainingIndex = index;
    }
    const previous = source[index - 1];
    if (previous && previous.usedPercent - point.usedPercent >= RESET_JUMP_THRESHOLD) {
      importantIndexes.add(index - 1);
      importantIndexes.add(index);
    }
  });
  importantIndexes.add(minimumRemainingIndex);

  const buckets = new Map<number, TrendPoint>();
  source.forEach((point) => {
    buckets.set(Math.floor(point.timestamp / TRAY_BUCKET_SECONDS), point);
  });

  return Array.from(
    new Map(
      [...buckets.values(), ...Array.from(importantIndexes, (index) => source[index])].map(
        (point) => [point.timestamp, point],
      ),
    ).values(),
  ).sort((left, right) => left.timestamp - right.timestamp);
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

function TrayTimeTick({
  x,
  y,
  payload,
  index,
  visibleTicksCount,
  showTime,
  showNow = false,
  compact = false,
}: XAxisTickContentProps & { showTime: boolean; showNow?: boolean; compact?: boolean }) {
  const textAnchor = index === 0 ? "start" : index === visibleTicksCount - 1 ? "end" : "middle";
  const label =
    showNow && index === visibleTicksCount - 1
      ? "现在"
      : formatTrayTime(Number(payload.value), showTime);

  return (
    <text
      x={x}
      y={y}
      dy="0.71em"
      textAnchor={textAnchor}
      fill="var(--tray-muted)"
      fontSize={compact ? 8 : 11}
      fontWeight={450}
    >
      {label}
    </text>
  );
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
  rangeSeconds = TRAY_WINDOW_SECONDS,
  compact = false,
}: {
  history: TrendPoint[];
  rangeSeconds?: number;
  compact?: boolean;
}) {
  const source = downsampleTrayHistory(history);
  const lastTimestamp = source.at(-1)?.timestamp ?? 0;
  const firstTimestamp = lastTimestamp - rangeSeconds;
  const { data: resetAwareData } = buildResetAwareTrayHistory(source);
  const data = resetAwareData;
  if (data.length === 0)
    return <div className="tray-trend-chart tray-trend-chart--empty">暂无趋势数据</div>;
  const last = data.at(-1);
  const resetPoints = data.filter(
    (point, index) =>
      !point.resetBoundary &&
      data[index - 1]?.resetBoundary &&
      data[index - 1]?.timestamp === point.timestamp,
  );
  const latestReset = resetPoints.at(-1);
  const preResetPoint = latestReset
    ? data.find((point) => point.resetBoundary && point.timestamp === latestReset.timestamp)
    : data.reduce((lowest, point) =>
        point.remainingPercent < lowest.remainingPercent ? point : lowest,
      );
  const timeTicks = buildContinuousTimeTicks(firstTimestamp, lastTimestamp);
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
              ? { top: 12, right: 1, bottom: 0, left: 0 }
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
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tickFormatter={formatPercent}
            tickLine={false}
            axisLine={false}
            width={compact ? 28 : 40}
            tick={{ fill: "var(--tray-text)", fontSize: compact ? 8 : 11, fontWeight: 450 }}
          />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="linear"
            domain={[firstTimestamp, lastTimestamp]}
            ticks={timeTicks}
            tick={(props) => (
              <TrayTimeTick
                {...props}
                showTime={rangeSeconds <= TRAY_WINDOW_SECONDS}
                showNow
                compact={compact}
              />
            )}
            tickLine={false}
            axisLine={{ stroke: "var(--tray-axis)", strokeWidth: 1 }}
            interval={0}
            height={compact ? 18 : 27}
            tickMargin={compact ? 4 : 10}
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
            strokeWidth={compact ? 1.4 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
            activeDot={{
              r: compact ? 3 : 4,
              fill: "var(--tray-chart-line)",
              stroke: "var(--tray-tooltip)",
              strokeWidth: compact ? 1.2 : 2,
            }}
            isAnimationActive={false}
          />
          {latestReset && resetLabel && (
            <ReferenceLine
              x={latestReset.timestamp}
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
          {preResetPoint && preResetPoint !== last && (
            <ReferenceDot
              x={preResetPoint.timestamp}
              y={preResetPoint.remainingPercent}
              r={0}
              fill="none"
              stroke="none"
              label={{
                value: formatPercent(preResetPoint.remainingPercent),
                position: "bottom",
                offset: compact ? 4 : 8,
                dx: compact ? -6 : -10,
                fill: "var(--tray-text)",
                fontSize: compact ? 8 : 11,
                fontWeight: 550,
              }}
            />
          )}
          {last && (
            <>
              <ReferenceDot
                x={last.timestamp}
                y={last.remainingPercent}
                r={compact ? 5 : 8}
                fill="var(--tray-current-halo)"
                stroke="none"
              />
              <ReferenceDot
                x={last.timestamp}
                y={last.remainingPercent}
                r={compact ? 3 : 4.5}
                fill="var(--tray-chart-line)"
                stroke="var(--tray-tooltip)"
                strokeWidth={compact ? 1 : 1.5}
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
