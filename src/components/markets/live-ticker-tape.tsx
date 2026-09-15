import { Link } from "react-router-dom";
import { Activity, Wifi, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useLiveMarket } from "@/hooks/use-live-market";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

// Top featured assets for the live ticker tape
const TICKER_SYMBOLS = ["BTC", "ETH", "SOL", "NVDA", "AAPL", "SPY", "XAU", "TSLA"];

export function LiveTickerTape() {
  const { getLiveAsset, flashStates, telemetry } = useLiveMarket();

  const isConnected = telemetry.state === "connected";

  return (
    <aside aria-label="Live Market Feeds" className="relative border-b border-border/60 bg-surface/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1400px] items-center overflow-x-auto px-4 py-2 scrollbar-none sm:px-6 lg:px-8">
        {/* Live Stream Status Badge */}
        <div className="mr-3 flex shrink-0 items-center gap-1.5 border-r border-border/60 pr-3">
          <span className="relative flex size-2">
            {isConnected && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            )}
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                isConnected ? "bg-success" : "bg-warning"
              )}
            />
          </span>
          <span className="font-mono text-[11px] font-semibold tracking-wider text-foreground uppercase">
            LIVE
          </span>
          <span className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:inline-flex">
            <Wifi className="size-3 text-muted-foreground/70" />
            {isConnected ? `${telemetry.latencyMs || 24}ms` : "reconnecting"}
          </span>
        </div>

        {/* Streaming Ticker Items */}
        <div className="flex items-center gap-2 sm:gap-3">
          {TICKER_SYMBOLS.map((symbol) => {
            const asset = getLiveAsset(symbol);
            if (!asset) return null;

            const flash = flashStates[symbol];
            const isPositive = asset.changePercent24h >= 0;

            return (
              <Link
                key={symbol}
                to={`/markets/${symbol}`}
                className={cn(
                  "group flex shrink-0 items-center gap-2 rounded-md border border-border/40 bg-surface px-2.5 py-1 text-xs transition-all duration-300 hover:border-primary/40 hover:bg-surface-elevated",
                  flash === "up" && "ring-1 ring-success/60 bg-success/10",
                  flash === "down" && "ring-1 ring-destructive/60 bg-destructive/10"
                )}
              >
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {symbol}
                </span>
                <span
                  className={cn(
                    "font-mono font-medium transition-colors",
                    flash === "up" && "text-success font-bold",
                    flash === "down" && "text-destructive font-bold",
                    !flash && "text-foreground"
                  )}
                >
                  {formatCurrency(asset.price)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center text-[10px] font-mono",
                    isPositive ? "text-success" : "text-destructive"
                  )}
                >
                  {isPositive ? (
                    <ArrowUpRight className="size-2.5 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="size-2.5 mr-0.5" />
                  )}
                  {Math.abs(asset.changePercent24h).toFixed(2)}%
                </span>
              </Link>
            );
          })}
        </div>

        {/* Updates telemetry pill */}
        <div className="ml-auto hidden shrink-0 items-center gap-1 pl-3 text-[11px] text-muted-foreground lg:flex">
          <Activity className="size-3 text-primary animate-pulse" />
          <span className="font-mono text-[10px]">
            {telemetry.tickCount.toLocaleString()} ticks
          </span>
        </div>
      </div>
    </aside>
  );
}
