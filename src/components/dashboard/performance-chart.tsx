import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getPortfolioPerformance } from "@/data/portfolio";
import type { ChartRange } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format";

const RANGES: ChartRange[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"];

function formatAxisTick(iso: string, range: ChartRange): string {
  if (range === "1D") return formatDateTime(iso).split(",")[1]?.trim() ?? "";
  return formatDate(iso, { month: "short", day: "numeric" });
}

function ChartTooltip({ active, payload, range }: { active?: boolean; payload?: Array<{ payload: { date: string; value: number; benchmark?: number } }>; range: ChartRange }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-md border border-border bg-surface-elevated px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">
        {range === "1D" ? formatDateTime(point.date) : formatDate(point.date, { month: "short", day: "numeric", year: "numeric" })}
      </p>
      <p className="font-mono text-sm font-semibold text-foreground">{formatCurrency(point.value)}</p>
      {point.benchmark !== undefined && (
        <p className="font-mono text-xs text-muted-foreground">Benchmark {formatCurrency(point.benchmark)}</p>
      )}
    </div>
  );
}

function PerformanceChart() {
  const [range, setRange] = useState<ChartRange>("1M");
  const data = useMemo(() => getPortfolioPerformance(range), [range]);

  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const rangeReturnPercent = first ? ((last - first) / first) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">Return over period</span>
          <span className={cn("font-mono text-sm font-semibold", rangeReturnPercent >= 0 ? "text-success" : "text-destructive")}>
            {rangeReturnPercent >= 0 ? "+" : ""}
            {rangeReturnPercent.toFixed(2)}%
          </span>
        </div>

        <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/50 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded-[5px] px-2.5 py-1.5 text-xs font-semibold transition-colors",
                range === r ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px] w-full sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatAxisTick(value, range)}
              stroke="var(--color-border)"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              orientation="right"
              tickFormatter={(value) => formatCurrency(value, { compact: true })}
              stroke="var(--color-border)"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              width={56}
              domain={["dataMin - 2000", "dataMax + 2000"]}
            />
            <Tooltip content={<ChartTooltip range={range} />} />
            <Area
              type="monotone"
              dataKey="benchmark"
              stroke="var(--color-muted-foreground)"
              strokeWidth={1.25}
              strokeDasharray="4 3"
              fill="none"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fill="url(#portfolioFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full bg-primary" /> Portfolio value
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full border-t border-dashed border-muted-foreground" /> S&amp;P 500 benchmark
        </span>
      </div>
    </div>
  );
}

export { PerformanceChart };
