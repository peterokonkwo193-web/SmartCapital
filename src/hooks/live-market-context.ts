import { createContext } from "react";
import type { Asset, AssetCategory } from "@/types";
import type { LiveQuoteUpdate, LiveFeedTelemetry } from "@/lib/live-market-service";

export interface LiveMarketContextType {
  assets: Asset[];
  telemetry: LiveFeedTelemetry;
  flashStates: Record<string, "up" | "down" | undefined>;
  getLiveAsset: (symbol: string) => Asset | undefined;
  getLiveQuote: (symbol: string) => LiveQuoteUpdate | undefined;
  getAssetsByCategory: (category: AssetCategory | "all") => Asset[];
}

export const LiveMarketContext = createContext<LiveMarketContextType | null>(null);
