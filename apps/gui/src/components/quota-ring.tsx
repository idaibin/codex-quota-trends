import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { QuotaWindow } from "../types";
import { formatPercent, formatResetDuration } from "../utils/format";

export function QuotaRing({
  quotaWindow,
  compact = false,
}: {
  quotaWindow: QuotaWindow;
  compact?: boolean;
}) {
  const used = Math.min(100, Math.max(0, quotaWindow.usedPercent));
  const remaining = 100 - used;
  const data = [
    { value: remaining, fill: "var(--accent)" },
    { value: used, fill: "var(--track)" },
  ];

  return (
    <div className={`quota-ring-layout ${compact ? "quota-ring-layout--compact" : ""}`}>
      <div className="quota-ring" aria-label={`${formatPercent(remaining)} remaining`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius="80%"
              outerRadius="100%"
              stroke="none"
              cornerRadius={8}
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.fill} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="quota-ring__label">
          <strong>{formatPercent(remaining)}</strong>
          <span>Remaining</span>
        </div>
      </div>
      <div className="quota-ring__metrics">
        <div className="primary-metric">
          <strong>{formatPercent(remaining)}</strong>
          <span>Quota Remaining</span>
        </div>
        <div>
          <strong>{formatPercent(used)}</strong>
          <span>Quota Used</span>
        </div>
        <div className="accent-metric">
          <strong>{formatResetDuration(quotaWindow.resetAt)}</strong>
          <span>Until Reset</span>
        </div>
      </div>
    </div>
  );
}
