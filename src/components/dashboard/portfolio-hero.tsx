import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { TrendValue } from "@/components/common/trend-value";
import { ASSET_MAP } from "@/data/assets";
import { usePaperTrading } from "@/hooks/use-paper-trading";
import { calculatePortfolioSummary } from "@/lib/portfolio-calc";
import { formatCurrency } from "@/utils/format";

function PortfolioHero() {
  const { orders, balance } = usePaperTrading();

  const summary = useMemo(() => {
    return calculatePortfolioSummary(balance, orders, ASSET_MAP);
  }, [balance, orders]);

  return (
    <Card>
      <CardContent className="space-y-7">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,280px)_1fr]">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
              <p className="mt-1.5 font-mono text-[38px] font-semibold leading-none tracking-tight text-foreground sm:text-[44px]">
                {formatCurrency(summary.totalPortfolioValue)}
              </p>
              <div className="mt-2.5">
                <TrendValue value={summary.dailyChangePercent} className="text-[15px]" />
                <span className="ml-1.5 text-sm text-muted-foreground">today</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-5">
              <Metric label="Available Balance" value={formatCurrency(summary.cashBalance)} />
              <Metric label="Open Positions" value={String(summary.openPositionsCount)} />
            </div>
          </div>

          <div className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <PerformanceChart />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

export { PortfolioHero };
