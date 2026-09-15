import { Link } from "react-router-dom";
import { Star } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/common/sparkline";
import { TrendValue } from "@/components/common/trend-value";
import { CATEGORY_LABELS } from "@/data/assets";
import { useLiveMarket } from "@/hooks/use-live-market";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/utils/format";
import type { Asset } from "@/types";

interface AssetTableProps {
  assets: Asset[];
  watchlistSymbols?: Set<string>;
  onToggleWatchlist?: (symbol: string) => void;
}

function AssetTable({ assets, watchlistSymbols, onToggleWatchlist }: AssetTableProps) {
  const { flashStates } = useLiveMarket();

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>24H</TableHead>
              <TableHead>Market Cap</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => {
              const positive = asset.changePercent24h >= 0;
              const inWatchlist = watchlistSymbols?.has(asset.symbol);
              const flash = flashStates[asset.symbol];

              return (
                <TableRow key={asset.symbol}>
                  <TableCell>
                    {onToggleWatchlist && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={inWatchlist ? `Remove ${asset.symbol} from watchlist` : `Add ${asset.symbol} to watchlist`}
                        onClick={() => onToggleWatchlist(asset.symbol)}
                      >
                        <Star className={cn("size-4", inWatchlist ? "fill-accent text-accent" : "text-muted-foreground")} />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link to={`/markets/${asset.symbol}`} className="block">
                      <span className="block text-sm font-medium text-foreground">{asset.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {asset.symbol} · {CATEGORY_LABELS[asset.category]}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono">
                    <span
                      className={cn(
                        "inline-block rounded px-1.5 py-0.5 transition-all duration-300",
                        flash === "up" && "bg-success/20 text-success font-semibold",
                        flash === "down" && "bg-destructive/20 text-destructive font-semibold"
                      )}
                    >
                      {formatCurrency(asset.price)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <TrendValue value={asset.changePercent24h} />
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {asset.marketCap > 0 ? formatCurrency(asset.marketCap, { compact: true }) : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{formatNumber(asset.volume24h, { compact: true })}</TableCell>
                  <TableCell>
                    <Sparkline data={asset.sparkline} positive={positive} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2.5 md:hidden">
        {assets.map((asset) => {
          const positive = asset.changePercent24h >= 0;
          const inWatchlist = watchlistSymbols?.has(asset.symbol);
          const flash = flashStates[asset.symbol];

          return (
            <Link
              key={asset.symbol}
              to={`/markets/${asset.symbol}`}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border bg-surface p-3.5 transition-colors",
                flash === "up" && "border-success/50 bg-success/5",
                flash === "down" && "border-destructive/50 bg-destructive/5"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{asset.name}</p>
                <p className="text-xs text-muted-foreground">
                  {asset.symbol} · {CATEGORY_LABELS[asset.category]}
                </p>
              </div>
              <Sparkline data={asset.sparkline} positive={positive} className="hidden xs:block" />
              <div className="shrink-0 text-right">
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
              {onToggleWatchlist && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0"
                  aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                  onClick={(e) => {
                    e.preventDefault();
                    onToggleWatchlist(asset.symbol);
                  }}
                >
                  <Star className={cn("size-4", inWatchlist ? "fill-accent text-accent" : "text-muted-foreground")} />
                </Button>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}

export { AssetTable };
