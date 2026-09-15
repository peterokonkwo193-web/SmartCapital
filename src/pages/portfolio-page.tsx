import { useEffect, useMemo } from "react";

import { PageHeader } from "@/components/common/page-header";
import { PaperTradingBanner } from "@/components/common/paper-trading-banner";
import { TrendValue } from "@/components/common/trend-value";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { AllocationCard } from "@/components/dashboard/allocation-card";
import { ASSET_MAP } from "@/data/assets";
import { usePaperTrading } from "@/hooks/use-paper-trading";
import { calculatePortfolioSummary, calculatePositions } from "@/lib/portfolio-calc";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import { LayoutGrid } from "lucide-react";

function PortfolioPage() {
  const { orders, balance } = usePaperTrading();

  useEffect(() => {
    document.title = "Portfolio — SmartCapital";
  }, []);

  const summary = useMemo(() => {
    return calculatePortfolioSummary(balance, orders, ASSET_MAP);
  }, [balance, orders]);

  const positions = useMemo(() => {
    return calculatePositions(orders, ASSET_MAP);
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Live Portfolio" description="A detailed real-time breakdown of your live holdings and mark-to-market performance." />
        <PaperTradingBanner />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardContent className="py-4">
            <span className="text-xs text-muted-foreground">Total Portfolio Value</span>
            <p className="font-mono text-lg font-semibold">{formatCurrency(summary.totalPortfolioValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <span className="text-xs text-muted-foreground">Cash Balance</span>
            <p className="font-mono text-lg font-semibold">{formatCurrency(summary.cashBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <span className="text-xs text-muted-foreground">Positions Value</span>
            <p className="font-mono text-lg font-semibold">{formatCurrency(summary.positionsValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <span className="text-xs text-muted-foreground">Unrealized P&amp;L</span>
            <TrendValue value={summary.totalUnrealizedPnLPercent} className="text-sm font-semibold" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <span className="text-xs text-muted-foreground">Realized P&amp;L</span>
            <p
              className={cn(
                "font-mono text-sm font-semibold",
                summary.totalRealizedPnL > 0.005
                  ? "text-success"
                  : summary.totalRealizedPnL < -0.005
                    ? "text-destructive"
                    : "text-muted-foreground",
              )}
            >
              {formatCurrency(summary.totalRealizedPnL)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>Portfolio value performance vs. S&amp;P 500 benchmark.</CardDescription>
        </CardHeader>
        <CardContent>
          <PerformanceChart />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Open Positions</CardTitle>
              <CardDescription>{positions.length} active live holdings</CardDescription>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-semibold">{formatCurrency(summary.positionsValue)}</p>
              <TrendValue value={summary.totalUnrealizedPnLPercent} className="justify-end text-xs" />
            </div>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <EmptyState
                icon={LayoutGrid}
                title="No open positions in portfolio"
                description="Positions established through filled live orders will appear here automatically."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Avg Cost</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Market Value</TableHead>
                      <TableHead>Unrealized P&amp;L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((pos) => (
                      <TableRow key={pos.symbol}>
                        <TableCell className="font-medium">
                          {pos.symbol}
                          <span className="ml-1.5 text-[10px] font-semibold text-emerald-500">LIVE</span>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">{pos.quantity.toFixed(4).replace(/\.?0+$/, "")}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{formatCurrency(pos.avgCost)}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(pos.currentPrice)}</TableCell>
                        <TableCell className="font-mono font-medium">{formatCurrency(pos.marketValue)}</TableCell>
                        <TableCell>
                          <TrendValue value={pos.unrealizedPnLPercent} showIcon={false} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AllocationCard />
      </div>
    </div>
  );
}

export default PortfolioPage;
