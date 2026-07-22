import {
  Area,
  AreaChart,
  CartesianGrid,
  type LabelProps,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
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
const TRAY_INTERVAL_SECONDS = {
  24: 30 * 60,
  168: 2 * 60 * 60,
} as const;

type TrayRangeHours = keyof typeof TRAY_INTERVAL_SECONDS;

export const getCurrentMarkerLayout = (compact: boolean, currentValue: number) =>
  compact
    ? {
        dotRadius: 1,
        haloRadius: 2,
        labelFontSize: 9,
        labelOffset: 5,
        rightMargin:
          7 + Math.min(3, Math.max(1, String(Math.abs(Math.round(currentValue))).length)) * 5,
        strokeWidth: 0,
      }
    : {
        dotRadius: 4,
        haloRadius: 8,
        labelFontSize: 12,
        labelOffset: 8,
        rightMargin: 40,
        strokeWidth: 1,
      };

export const formatTrayPercentTick = (value: number) => String(Math.round(value));

export const getTrayHorizontalGuideTicks = (ticks: number[]) => ticks.slice(0, -1);

interface TrayIntervalPoint extends TrendPoint {
  intervalStart: number;
  intervalEnd: number;
  consumedPercent: number;
  correctedPercent: number;
  resetStart: boolean;
}

interface TrayTrendDatum extends TrendPoint {
  remainingPercent: number;
  intervalStart: number;
  intervalEnd: number;
  consumedPercent: number;
  correctedPercent: number;
  resetBoundary: boolean;
  resetStart: boolean;
  resetClassified: boolean;
  resetToPercent: number | null;
}

interface TrayRenderableDatum extends TrayTrendDatum {
  historyRemainingPercent: number | null;
}

const formatTrayTooltipTime = (timestamp: number) =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp * 1_000));

const formatTrayTooltipEndTime = (timestamp: number) =>
  new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp * 1_000));

const formatTrayTooltipInterval = (start: number, end: number) =>
  `${formatTrayTooltipTime(start)}–${formatTrayTooltipEndTime(end)}`;

const roundOne = (value: number) => Math.round(value * 10) / 10;

function TrayChartTooltip({
  active,
  coordinate,
  payload,
  compact,
}: TooltipContentProps<number, string> & { compact: boolean }) {
  if (!active || !coordinate || !payload.length) return null;

  const point = payload[0]?.payload as TrayTrendDatum | undefined;
  if (!point) return null;

  const alignment = compact
    ? coordinate.x < 72
      ? "start"
      : coordinate.x > 250
        ? "end"
        : "center"
    : "center";
  const verticalPlacement = coordinate.y < (compact ? 52 : 70) ? "below" : "above";

  return (
    <div
      className={`tray-chart-tooltip tray-chart-tooltip--${alignment} tray-chart-tooltip--${verticalPlacement}`}
    >
      <strong>
        {point.resetBoundary || point.resetStart
          ? formatTrayTooltipTime(point.timestamp)
          : formatTrayTooltipInterval(point.intervalStart, point.intervalEnd)}
      </strong>
      {point.resetBoundary ? (
        <span>
          重置：<b>{formatPercent(point.remainingPercent)}</b>
          {point.resetToPercent != null && <> → {formatPercent(point.resetToPercent)}</>}
        </span>
      ) : point.resetStart ? (
        <span>
          重置后剩余：<b>{formatPercent(point.remainingPercent)}</b>
        </span>
      ) : (
        <span>
          本段消耗：<b>{formatPercent(point.consumedPercent)}</b>
        </span>
      )}
      {!point.resetBoundary && !point.resetStart && point.correctedPercent > 0 && (
        <span>
          额度调整：<b>+{formatPercent(point.correctedPercent)}</b>
        </span>
      )}
      {!point.resetBoundary && !point.resetStart && (
        <span>
          剩余额度：<b>{formatPercent(point.remainingPercent)}</b>
        </span>
      )}
    </div>
  );
}

function CurrentValueLabel({ viewBox, value, compact }: LabelProps & { compact: boolean }) {
  if (!viewBox || !("x" in viewBox)) return null;

  const centerX = viewBox.x + viewBox.width / 2;
  const centerY = viewBox.y + viewBox.height / 2;
  const layout = getCurrentMarkerLayout(compact, Number(value ?? 0));

  return (
    <text
      x={centerX + layout.labelOffset}
      y={centerY}
      fill="var(--tray-accent)"
      fontSize={layout.labelFontSize}
      fontWeight={600}
      style={{ fontVariantNumeric: "tabular-nums" }}
      dominantBaseline="middle"
      textAnchor="start"
      aria-hidden="true"
    >
      {value}
    </text>
  );
}

export function buildResetAwareTrayHistory(history: TrendPoint[]): {
  data: TrayTrendDatum[];
  hasReset: boolean;
} {
  const source = [...history]
    .sort((left, right) => left.timestamp - right.timestamp)
    .map((point) => ({
      ...point,
      remainingPercent: 100 - point.usedPercent,
      intervalStart: "intervalStart" in point ? Number(point.intervalStart) : point.timestamp,
      intervalEnd: "intervalEnd" in point ? Number(point.intervalEnd) : point.timestamp,
      consumedPercent: "consumedPercent" in point ? Number(point.consumedPercent) : 0,
      correctedPercent: "correctedPercent" in point ? Number(point.correctedPercent) : 0,
      resetBoundary: false,
      resetStart: "resetStart" in point && Boolean(point.resetStart),
      resetClassified: "resetStart" in point,
      resetToPercent: null,
    }));
  const data: TrayTrendDatum[] = [];
  let hasReset = false;

  source.forEach((point, index) => {
    const previous = source[index - 1];
    const isReset = point.resetClassified
      ? point.resetStart
      : previous != null &&
        point.remainingPercent - previous.remainingPercent >= RESET_JUMP_THRESHOLD;
    if (previous && isReset) {
      hasReset = true;
      data.push({
        ...point,
        usedPercent: previous.usedPercent,
        remainingPercent: previous.remainingPercent,
        consumedPercent: 0,
        correctedPercent: 0,
        resetBoundary: true,
        resetStart: false,
        resetClassified: true,
        resetToPercent: point.remainingPercent,
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
  if (maximum - minimum < 0.001) {
    const center = Math.round(minimum);
    const lower = Math.min(98, Math.max(0, center - 1));
    const ticks = [lower, lower + 1, lower + 2];
    return {
      domain: [Math.max(0, lower - 1), Math.min(105, lower + 3)],
      ticks,
    };
  }

  const rawStep = (maximum - minimum) / 2;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / magnitude;
  const niceFraction =
    fraction <= 1
      ? 1
      : fraction <= 2
        ? 2
        : fraction <= 2.5
          ? 2.5
          : fraction <= 3
            ? 3
            : fraction <= 5
              ? 5
              : 10;
  const step = niceFraction * magnitude;
  const anchor = Math.max(1, step / 2);
  let lower = Math.floor(minimum / anchor) * anchor;
  let upper = lower + step * 2;
  if (upper < maximum) {
    upper = Math.ceil(maximum / anchor) * anchor;
    lower = upper - step * 2;
  }
  if (lower < 0) {
    lower = 0;
    upper = step * 2;
  }
  if (upper > 100) {
    upper = 100;
    lower = Math.max(0, upper - step * 2);
  }
  const ticks = [lower, lower + step, upper].map(roundOne);
  const padding = Math.max(1, step * 0.08);
  const domain: [number, number] = [
    roundOne(Math.max(0, lower - padding)),
    roundOne(Math.min(105, upper + padding)),
  ];

  return { domain, ticks };
}

export function trayIntervalSeconds(rangeHours: TrayRangeHours): number {
  return TRAY_INTERVAL_SECONDS[rangeHours];
}

const intervalBounds = (timestamp: number, intervalSeconds: number) => {
  const intervalStart = Math.floor(timestamp / intervalSeconds) * intervalSeconds;
  return { intervalStart, intervalEnd: intervalStart + intervalSeconds };
};

export function aggregateTrayHistory(
  history: TrendPoint[],
  rangeHours: TrayRangeHours,
): TrayIntervalPoint[] {
  const source = [...history]
    .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.usedPercent))
    .sort((left, right) => left.timestamp - right.timestamp);
  const first = source[0];
  if (!first) return [];

  const intervalSeconds = trayIntervalSeconds(rangeHours);
  const latestTimestamp = source.at(-1)?.timestamp ?? first.timestamp;
  const createPoint = (
    point: TrendPoint,
    consumedPercent: number,
    correctedPercent: number,
    resetStart: boolean,
  ): TrayIntervalPoint => {
    const bounds = intervalBounds(point.timestamp, intervalSeconds);
    return {
      ...point,
      ...bounds,
      intervalEnd: Math.min(bounds.intervalEnd, latestTimestamp),
      consumedPercent: roundOne(consumedPercent),
      correctedPercent: roundOne(correctedPercent),
      resetStart,
    };
  };
  const output = [createPoint(first, 0, 0, false)];
  let pending: TrayIntervalPoint | null = null;

  const flushPending = () => {
    if (pending) output.push(pending);
    pending = null;
  };

  source.slice(1).forEach((point, index) => {
    const previous = source[index];
    const delta = point.usedPercent - previous.usedPercent;
    const resetStart = delta <= -RESET_JUMP_THRESHOLD;
    if (resetStart) {
      flushPending();
      output.push(createPoint(point, 0, 0, true));
      return;
    }

    const bounds = intervalBounds(point.timestamp, intervalSeconds);
    const consumedPercent = delta > 0 ? delta : 0;
    const correctedPercent = delta < 0 ? -delta : 0;
    if (pending?.intervalStart === bounds.intervalStart) {
      pending = {
        ...pending,
        ...point,
        ...bounds,
        intervalEnd: Math.min(bounds.intervalEnd, latestTimestamp),
        consumedPercent: roundOne(pending.consumedPercent + consumedPercent),
        correctedPercent: roundOne(pending.correctedPercent + correctedPercent),
      };
    } else {
      flushPending();
      pending = createPoint(point, consumedPercent, correctedPercent, false);
    }
  });
  flushPending();

  return output;
}

export function buildTrayChartData(
  history: TrendPoint[],
  rangeHours: TrayRangeHours = 24,
): TrayTrendDatum[] {
  const source = aggregateTrayHistory(history, rangeHours);
  return buildResetAwareTrayHistory(source).data.slice(-TRAY_POINT_LIMIT);
}

export function buildTrayRenderableData(
  history: TrendPoint[],
  rangeHours: TrayRangeHours = 24,
): TrayRenderableDatum[] {
  const data = buildTrayChartData(history, rangeHours);
  return data.map((point, index) => ({
    ...point,
    historyRemainingPercent: index === data.length - 1 ? null : point.remainingPercent,
  }));
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
  rangeHours = 24,
}: {
  history: TrendPoint[];
  compact?: boolean;
  rangeHours?: TrayRangeHours;
}) {
  const data = buildTrayRenderableData(history, rangeHours);
  if (data.length === 0)
    return <div className="tray-trend-chart tray-trend-chart--empty">暂无趋势数据</div>;
  const lastTimestamp = data.at(-1)?.timestamp ?? data[0].timestamp;
  const firstTimestamp = lastTimestamp - rangeHours * 60 * 60;
  const percentScale = buildAvailablePercentScale(data);
  const last = data.at(-1);
  const currentMarkerLayout = getCurrentMarkerLayout(compact, last?.remainingPercent ?? 0);
  const previous = last
    ? data
        .slice(0, -1)
        .reverse()
        .find((point) => point.timestamp < last.timestamp)
    : undefined;
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
              ? { top: 0, right: currentMarkerLayout.rightMargin, bottom: 8, left: 0 }
              : { top: 26, right: currentMarkerLayout.rightMargin, bottom: 2, left: 0 }
          }
        >
          <CartesianGrid
            stroke="var(--tray-chart-grid)"
            strokeDasharray="2 5"
            strokeOpacity={0.68}
            horizontalValues={getTrayHorizontalGuideTicks(percentScale.ticks)}
            vertical={false}
          />
          <YAxis
            domain={percentScale.domain}
            ticks={percentScale.ticks}
            tickFormatter={formatTrayPercentTick}
            tickLine={false}
            axisLine={false}
            width={compact ? 28 : 40}
            tick={{ fill: "var(--tray-text)", fontSize: compact ? 8 : 11, fontWeight: 450 }}
          />
          <XAxis
            hide
            dataKey="timestamp"
            type="number"
            scale="linear"
            domain={[firstTimestamp, lastTimestamp]}
            height={0}
          />
          <Tooltip
            content={(tooltipProps) => (
              <TrayChartTooltip
                {...(tooltipProps as TooltipContentProps<number, string>)}
                compact={compact}
              />
            )}
            cursor={false}
            offset={{ x: 0, y: compact ? 4 : 8 }}
            reverseDirection={{ y: true }}
            isAnimationActive={false}
            wrapperStyle={{ outline: "none", zIndex: 10 }}
          />
          <Line
            type="stepAfter"
            dataKey="historyRemainingPercent"
            stroke="var(--tray-chart-line)"
            strokeWidth={compact ? 1 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
            activeDot={false}
            tooltipType="none"
            isAnimationActive={false}
          />
          <Line
            type="stepAfter"
            dataKey="remainingPercent"
            stroke="transparent"
            strokeWidth={compact ? 6 : 8}
            dot={false}
            activeDot={{
              r: compact ? 3 : 4,
              fill: "var(--tray-chart-line)",
              stroke: "var(--tray-tooltip)",
              strokeWidth: compact ? 1 : 1.5,
            }}
            isAnimationActive={false}
          />
          {last && previous && (
            <>
              <ReferenceLine
                segment={[
                  { x: previous.timestamp, y: previous.remainingPercent },
                  { x: previous.timestamp, y: last.remainingPercent },
                ]}
                stroke="var(--tray-chart-line)"
                strokeWidth={compact ? 1 : 2}
              />
              <ReferenceLine
                segment={[
                  { x: previous.timestamp, y: last.remainingPercent },
                  { x: last.timestamp, y: last.remainingPercent },
                ]}
                stroke="var(--tray-accent)"
                strokeWidth={compact ? 1.4 : 2.4}
                strokeLinecap="round"
              />
            </>
          )}
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
          {last && (
            <>
              <ReferenceDot
                x={last.timestamp}
                y={last.remainingPercent}
                r={currentMarkerLayout.haloRadius}
                fill="var(--tray-current-halo)"
                stroke="none"
              />
              <ReferenceDot
                x={last.timestamp}
                y={last.remainingPercent}
                r={currentMarkerLayout.dotRadius}
                fill="var(--tray-accent)"
                stroke="var(--tray-accent)"
                strokeWidth={currentMarkerLayout.strokeWidth}
                label={{
                  value: Math.round(last.remainingPercent),
                  content: (labelProps) => <CurrentValueLabel {...labelProps} compact={compact} />,
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
