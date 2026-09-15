import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getAssetPriceHistory } from "@/data/assets";
import type { ChartRange } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/format";

const RANGES: ChartRange[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"];
const RANGE_POINTS: Record<ChartRange, number> = { "1D": 24, "1W": 7, "1M": 30, "3M": 90, "6M": 182, "1Y": 260, ALL: 365 };

function AssetPriceChart({ symbol, positive }: { symbol: string; positive: boolean }) {
  const [range, setRange] = useState<ChartRange>("3M");
  const data = useMemo(() => getAssetPriceHistory(symbol, RANGE_POINTS[range]), [symbol, range]);
  const color = positive ? "var(--color-success)" : "var(--color-destructive)";

  return (
    <div className="space-y-4">
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

      <div className="h-[260px] w-full sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`assetFill-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDate(value, { month: "short", day: "numeric" })}
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
              domain={["dataMin", "dataMax"]}
              padding={{ top: 16, bottom: 16 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as { date: string; value: number };
                return (
                  <div className="rounded-md border border-border bg-surface-elevated px-3 py-2 shadow-lg">
                    <p className="text-xs text-muted-foreground">{formatDate(point.date, { month: "short", day: "numeric", year: "numeric" })}</p>
                    <p className="font-mono text-sm font-semibold text-foreground">{formatCurrency(point.value)}</p>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#assetFill-${symbol})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export { AssetPriceChart };
