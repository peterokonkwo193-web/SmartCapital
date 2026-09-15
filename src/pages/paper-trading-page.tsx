import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, LayoutGrid, ReceiptText, Plus, Star, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { PaperTradingBanner } from "@/components/common/paper-trading-banner";
import { EmptyState } from "@/components/common/empty-state";
import { TrendValue } from "@/components/common/trend-value";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { PaperOrderForm } from "@/components/trading/paper-order-form";
import { getAssetBySymbol } from "@/data/assets";
import { useLiveMarket } from "@/hooks/use-live-market";
import { usePaperTrading } from "@/hooks/use-paper-trading";
import { useWatchlist } from "@/hooks/use-watchlist";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { calculatePositions } from "@/lib/portfolio-calc";

const STATUS_VARIANT = { filled: "success", open: "warning", cancelled: "outline" } as const;

function PaperTradingPage() {
  const { orders, balance, loading, addPracticeFunds, resetPracticeBalance, closePosition } = usePaperTrading();
  const { items: watchlist } = useWatchlist();
  const { assets: liveAssets } = useLiveMarket();
  const [addingFunds, setAddingFunds] = useState(false);
  const [closingSymbol, setClosingSymbol] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Live Trading — SmartCapital";
  }, []);

  const liveAssetMap = useMemo(() => {
    return liveAssets.reduce((acc, a) => ({ ...acc, [a.symbol.toUpperCase()]: a }), {} as Record<string, typeof liveAssets[0]>);
  }, [liveAssets]);

  const calculatedPositions = useMemo(() => {
    return calculatePositions(orders, liveAssetMap);
  }, [orders, liveAssetMap]);

  async function handleAddFunds() {
    setAddingFunds(true);
    try {
      await addPracticeFunds(5000);
      toast.success("Added $5,000 to account balance", { description: "Account balance updated." });
    } finally {
      setAddingFunds(false);
    }
  }

  async function handleResetBalance() {
    try {
      await resetPracticeBalance(0);
      toast.success("Account balance reset to $0.00", { description: "Account state cleared." });
    } catch {
      toast.error("Could not reset account balance.");
    }
  }

  async function handleClosePosition(symbol: string, currentPrice: number) {
    setClosingSymbol(symbol);
    try {
      await closePosition(symbol, currentPrice);
      toast.success(`Closed position for ${symbol}`, { description: `Sold at ${formatCurrency(currentPrice)} (LIVE MARKET)` });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to close position.");
    } finally {
      setClosingSymbol(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Live Trading Engine" description="Real-time order execution & live portfolio tracking — powered by live market data." />
        <PaperTradingBanner />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Wallet} label="Account Cash Balance" value={formatCurrency(balance)} />
        <StatCard icon={LayoutGrid} label="Open Positions" value={String(calculatedPositions.length)} />
        <StatCard icon={ReceiptText} label="Total Orders" value={String(orders.length)} />
        <StatCard icon={Star} label="Watchlist Count" value={String(watchlist.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Place Live Order</CardTitle>
            </CardHeader>
            <CardContent>
              <PaperOrderForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Watchlist</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/watchlist">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {watchlist.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No assets tracked yet.</p>
              ) : (
                watchlist.slice(0, 5).map((item) => {
                  const asset = liveAssetMap[item.symbol.toUpperCase()] ?? getAssetBySymbol(item.symbol);
                  if (!asset) return null;
                  return (
                    <Link
                      key={item.symbol}
                      to={`/markets/${asset.symbol}`}
                      className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted/50"
                    >
                      <span className="font-medium">{asset.symbol}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono">{formatCurrency(asset.price)}</span>
                        <TrendValue value={asset.changePercent24h} showIcon={false} className="text-xs" />
                      </span>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Live Portfolio Performance</CardTitle>
                <CardDescription>Real-time performance graph based on live market prices.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <PerformanceChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
              <div className="flex items-center gap-2">
                <CardTitle>Positions & Activity</CardTitle>
                <Badge variant="outline" className="font-mono text-[10px]">LIVE TRADE</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleAddFunds} disabled={addingFunds}>
                  <Plus className="mr-1 size-3.5" /> Add Funds
                </Button>
                <Button variant="secondary" size="sm" onClick={handleResetBalance}>
                  <RefreshCw className="mr-1 size-3.5" /> Reset Balance
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="positions">
                <TabsList className="mb-4">
                  <TabsTrigger value="positions">Open Positions ({calculatedPositions.length})</TabsTrigger>
                  <TabsTrigger value="history">Order History ({orders.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="positions">
                  {calculatedPositions.length === 0 ? (
                    <EmptyState
                      icon={LayoutGrid}
                      title="No open positions"
                      description="Filled live buy orders will establish open positions here."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Avg Cost</TableHead>
                            <TableHead>Current</TableHead>
                            <TableHead>Market Value</TableHead>
                            <TableHead>Unrealized P&L</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calculatedPositions.map((pos) => (
                            <TableRow key={pos.symbol}>
                              <TableCell className="font-medium">
                                {pos.symbol}
                                <span className="ml-2 text-xs text-muted-foreground">LIVE</span>
                              </TableCell>
                              <TableCell className="font-mono">{pos.quantity.toFixed(4).replace(/\.?0+$/, "")}</TableCell>
                              <TableCell className="font-mono text-muted-foreground">{formatCurrency(pos.avgCost)}</TableCell>
                              <TableCell className="font-mono">{formatCurrency(pos.currentPrice)}</TableCell>
                              <TableCell className="font-mono">{formatCurrency(pos.marketValue)}</TableCell>
                              <TableCell>
                                <TrendValue value={pos.unrealizedPnLPercent} showIcon={false} />
                                <span className="ml-1 text-xs font-mono text-muted-foreground">
                                  ({formatCurrency(pos.unrealizedPnL)})
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={closingSymbol === pos.symbol}
                                  onClick={() => handleClosePosition(pos.symbol, pos.currentPrice)}
                                >
                                  <XCircle className="mr-1 size-3.5" /> Close Position
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history">
                  {!loading && orders.length === 0 ? (
                    <EmptyState icon={ReceiptText} title="No trades yet" description="Place your first live order to see it here." />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead>Side</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">
                                {order.symbol}
                                <span className="ml-1 text-[10px] text-muted-foreground">LIVE</span>
                              </TableCell>
                              <TableCell className="capitalize">{order.side}</TableCell>
                              <TableCell className="capitalize text-muted-foreground">{order.type}</TableCell>
                              <TableCell className="font-mono">{order.quantity}</TableCell>
                              <TableCell className="font-mono">{formatCurrency(order.price)}</TableCell>
                              <TableCell>
                                <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{formatDateTime(order.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <span className="block text-xs text-muted-foreground">{label}</span>
          <span className="block font-mono text-lg font-semibold text-foreground">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default PaperTradingPage;
