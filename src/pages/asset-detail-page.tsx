import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Star, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendValue } from "@/components/common/trend-value";
import { AssetPriceChart } from "@/components/markets/asset-price-chart";
import { PaperOrderForm } from "@/components/trading/paper-order-form";
import { AssetTable } from "@/components/markets/asset-table";
import { CATEGORY_LABELS, getAssetBySymbol, getAssetPriceHistory } from "@/data/assets";
import { useLiveMarket } from "@/hooks/use-live-market";
import { useWatchlist } from "@/hooks/use-watchlist";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

function AssetDetailPage() {
  const { symbol = "" } = useParams();
  const [tradeOpen, setTradeOpen] = useState(false);
  const { getLiveAsset, assets, flashStates } = useLiveMarket();
  const asset = getLiveAsset(symbol) ?? getAssetBySymbol(symbol);
  const { has, toggle } = useWatchlist();

  useEffect(() => {
    if (asset) document.title = `${asset.symbol} — ${asset.name} — SmartCapital`;
  }, [asset]);

  if (!asset) return <Navigate to="/markets" replace />;

  const flash = flashStates[asset.symbol];
  const positive = asset.changePercent24h >= 0;
  const inWatchlist = has(asset.symbol);
  const history = getAssetPriceHistory(asset.symbol, 90);
  const historyValues = history.map((h) => h.value);
  const high90d = Math.max(...historyValues);
  const low90d = Math.min(...historyValues);
  const related = assets.filter((a) => a.category === asset.category && a.symbol !== asset.symbol).slice(0, 4);

  return (
    <div className="space-y-6">
      <Link to="/markets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Markets
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{asset.name}</h1>
            <Badge variant="outline">{asset.symbol}</Badge>
            <Badge variant="secondary">{CATEGORY_LABELS[asset.category]}</Badge>
            <Badge variant="outline" className="border-success/40 bg-success/10 text-success gap-1 font-mono text-[11px]">
              <span className="inline-block size-1.5 rounded-full bg-success animate-pulse" /> LIVE QUOTE
            </Badge>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span
              className={cn(
                "font-mono text-2xl font-semibold text-foreground transition-colors duration-300",
                flash === "up" && "text-success font-bold",
                flash === "down" && "text-destructive font-bold"
              )}
            >
              {formatCurrency(asset.price)}
            </span>
            <TrendValue value={asset.changePercent24h} className="text-base" />
            <span className="text-sm text-muted-foreground">24H</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => toggle(asset.symbol)}>
            <Star className={cn("size-4", inWatchlist && "fill-accent text-accent")} />
            {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
          </Button>
          <Button onClick={() => setTradeOpen(true)}>Trade {asset.symbol}</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetPriceChart symbol={asset.symbol} positive={positive} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{asset.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historical Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Close</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history
                    .slice(-8)
                    .reverse()
                    .map((point) => (
                      <TableRow key={point.date}>
                        <TableCell className="text-muted-foreground">{formatDate(point.date)}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(point.value)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About {asset.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>{asset.description}</p>
              {asset.sector && (
                <p>
                  <span className="font-medium text-foreground">Sector: </span>
                  {asset.sector}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatRow label="Market Cap" value={asset.marketCap > 0 ? formatCurrency(asset.marketCap, { compact: true }) : "—"} />
              <StatRow label="24H Volume" value={formatNumber(asset.volume24h, { compact: true })} />
              <StatRow label="90D High" value={formatCurrency(high90d)} />
              <StatRow label="90D Low" value={formatCurrency(low90d)} />
              <StatRow label="Risk Level" value={asset.riskLevel} />
            </CardContent>
          </Card>

          <Alert variant="warning">
            <AlertTitle>Risk Information</AlertTitle>
            <AlertDescription>
              This asset is classified as <strong className="text-foreground">{asset.riskLevel}</strong> risk. Real-time
              market execution is active. Always ensure your position sizing aligns with your investment strategy.
            </AlertDescription>
          </Alert>

          {related.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Assets</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                  <AssetTable assets={related} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={tradeOpen} onOpenChange={setTradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trade {asset.symbol}</DialogTitle>
            <DialogDescription>Execute real-time order for your live trading portfolio.</DialogDescription>
          </DialogHeader>
          <PaperOrderForm defaultSymbol={asset.symbol} onSuccess={() => setTradeOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium text-foreground">{value}</span>
    </div>
  );
}

export default AssetDetailPage;
