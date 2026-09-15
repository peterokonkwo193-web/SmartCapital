import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ASSETS } from "@/data/assets";
import type { Asset, AssetCategory } from "@/types";
import {
  liveMarketFeed,
  type LiveQuoteUpdate,
  type LiveFeedTelemetry,
} from "@/lib/live-market-service";
import { LiveMarketContext } from "@/hooks/live-market-context";

export function LiveMarketProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<Map<string, LiveQuoteUpdate>>(() => liveMarketFeed.getAllQuotes());
  const [telemetry, setTelemetry] = useState<LiveFeedTelemetry>(() => liveMarketFeed.getTelemetry());
  const [flashStates, setFlashStates] = useState<Record<string, "up" | "down" | undefined>>({});

  useEffect(() => {
    // Start live market stream
    liveMarketFeed.start();

    const unsubQuote = liveMarketFeed.onQuote((update) => {
      setQuotes((prev) => {
        const next = new Map(prev);
        next.set(update.symbol, update);
        return next;
      });

      if (update.direction === "up" || update.direction === "down") {
        const dir: "up" | "down" = update.direction;
        setFlashStates((prev) => ({
          ...prev,
          [update.symbol]: dir,
        }));

        // Clear flash animation after 900ms
        setTimeout(() => {
          setFlashStates((prev) => {
            if (prev[update.symbol] === dir) {
              const copy = { ...prev };
              delete copy[update.symbol];
              return copy;
            }
            return prev;
          });
        }, 900);
      }
    });

    const unsubStatus = liveMarketFeed.onStatus((tel) => {
      setTelemetry(tel);
    });

    return () => {
      unsubQuote();
      unsubStatus();
      liveMarketFeed.stop();
    };
  }, []);

  const liveAssets = useMemo(() => {
    return ASSETS.map((asset) => {
      const live = quotes.get(asset.symbol);
      if (!live) return asset;

      // Update recent sparkline with latest price if changed
      const currentSpark = [...asset.sparkline];
      if (currentSpark.length > 0 && live.price !== currentSpark[currentSpark.length - 1]) {
        currentSpark[currentSpark.length - 1] = live.price;
      }

      return {
        ...asset,
        price: live.price,
        changePercent24h: live.changePercent24h,
        volume24h: live.volume24h ?? asset.volume24h,
        sparkline: currentSpark,
      };
    });
  }, [quotes]);

  const assetMap = useMemo(() => {
    const map = new Map<string, Asset>();
    for (const a of liveAssets) {
      map.set(a.symbol.toUpperCase(), a);
    }
    return map;
  }, [liveAssets]);

  function getLiveAsset(symbol: string): Asset | undefined {
    return assetMap.get(symbol.toUpperCase());
  }

  function getLiveQuote(symbol: string): LiveQuoteUpdate | undefined {
    return quotes.get(symbol.toUpperCase());
  }

  function getAssetsByCategory(category: AssetCategory | "all"): Asset[] {
    if (category === "all") return liveAssets;
    return liveAssets.filter((a) => a.category === category);
  }

  return (
    <LiveMarketContext.Provider
      value={{
        assets: liveAssets,
        telemetry,
        flashStates,
        getLiveAsset,
        getLiveQuote,
        getAssetsByCategory,
      }}
    >
      {children}
    </LiveMarketContext.Provider>
  );
}
