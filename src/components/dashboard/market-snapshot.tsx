import { Link } from "react-router-dom";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sparkline } from "@/components/common/sparkline";
import { TrendValue } from "@/components/common/trend-value";
import { getAssetBySymbol } from "@/data/assets";
import { useLiveMarket } from "@/hooks/use-live-market";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const SNAPSHOT_SYMBOLS = ["SPX", "IXIC", "BTC", "ETH", "XAU"];
const SNAPSHOT_LABELS: Record<string, string> = {
  SPX: "S&P 500",
  IXIC: "NASDAQ",
  BTC: "Bitcoin",
  ETH: "Ethereum",
  XAU: "Gold",
};

function MarketSnapshot() {
  const { getLiveAsset, flashStates } = useLiveMarket();
  const assets = SNAPSHOT_SYMBOLS.map((symbol) => getLiveAsset(symbol) ?? getAssetBySymbol(symbol)).filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Market Snapshot</CardTitle>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-success">
            <span className="inline-block size-1.5 rounded-full bg-success animate-pulse" /> LIVE
          </span>
        </div>
        <CardDescription>Live streaming quotes across major benchmarks and digital assets.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {assets.map((asset) => {
          if (!asset) return null;
          const positive = asset.changePercent24h >= 0;
          const flash = flashStates[asset.symbol];

          return (
            <Link
              key={asset.symbol}
              to={`/markets/${asset.symbol}`}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50",
                flash === "up" && "bg-success/10",
                flash === "down" && "bg-destructive/10"
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{SNAPSHOT_LABELS[asset.symbol] ?? asset.name}</p>
                <p className="text-xs text-muted-foreground">{asset.symbol}</p>
              </div>
              <Sparkline data={asset.sparkline} positive={positive} className="hidden sm:block" />
              <div className="w-[104px] shrink-0 text-right">
                <p
                  className={cn(
                    "font-mono text-sm font-medium transition-colors",
                    flash === "up" && "text-success font-semibold",
                    flash === "down" && "text-destructive font-semibold",
                    !flash && "text-foreground"
                  )}
                >
                  {formatCurrency(asset.price)}
                </p>
                <TrendValue value={asset.changePercent24h} className="justify-end text-xs" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

export { MarketSnapshot };
