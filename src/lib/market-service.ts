import { ASSETS, ASSET_MAP, getAssetBySymbol } from "@/data/assets";
import type { Asset, AssetCategory } from "@/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/**
 * Service layer for market data lookups, search, category filtering, and quote caching.
 */
export async function getMarketAssets(category?: AssetCategory | "all"): Promise<{ assets: Asset[]; isDemoData: boolean }> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from("market_snapshots").select("*").order("symbol");
      if (category && category !== "all") {
        query = query.eq("category", category);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const assets: Asset[] = data.map((row) => ({
          symbol: row.symbol,
          name: row.name,
          category: row.category as AssetCategory,
          price: Number(row.price),
          changePercent24h: Number(row.change_24h),
          marketCap: Number(row.market_cap ?? 0),
          volume24h: Number(row.volume_24h ?? 0),
          sparkline: [Number(row.price) * 0.98, Number(row.price) * 0.99, Number(row.price)],
          description: `Market data snapshot for ${row.name}`,
          riskLevel: "Moderate",
        }));
        return { assets, isDemoData: false };
      }
    } catch {
      // Fallback to demo data on query failure or network issues
    }
  }

  let list = ASSETS;
  if (category && category !== "all") {
    list = list.filter((a) => a.category === category);
  }
  return { assets: list, isDemoData: true };
}

export function searchMarketAssets(query: string, category?: AssetCategory | "all"): Asset[] {
  const q = query.trim().toLowerCase();
  let list = q ? ASSETS.filter((a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)) : ASSETS;
  if (category && category !== "all") {
    list = list.filter((a) => a.category === category);
  }
  return list;
}

export function getSingleAsset(symbol: string): Asset | undefined {
  return getAssetBySymbol(symbol) ?? ASSET_MAP[symbol.toUpperCase()];
}
