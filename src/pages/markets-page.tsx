import { useEffect, useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { AssetTable } from "@/components/markets/asset-table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/data/assets";
import { useLiveMarket } from "@/hooks/use-live-market";
import { useWatchlist } from "@/hooks/use-watchlist";
import type { Asset, AssetCategory } from "@/types";
import { Wifi } from "lucide-react";

type SortKey = "marketCap" | "price" | "change" | "volume" | "name";

const SORTERS: Record<SortKey, (a: Asset, b: Asset) => number> = {
  marketCap: (a, b) => b.marketCap - a.marketCap,
  price: (a, b) => b.price - a.price,
  change: (a, b) => b.changePercent24h - a.changePercent24h,
  volume: (a, b) => b.volume24h - a.volume24h,
  name: (a, b) => a.name.localeCompare(b.name),
};

function MarketsPage() {
  const { assets, telemetry } = useLiveMarket();
  const [category, setCategory] = useState<AssetCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("marketCap");
  const { items, toggle } = useWatchlist();

  useEffect(() => {
    document.title = "Markets — SmartCapital Live Quotes";
  }, []);

  const watchlistSymbols = useMemo(() => new Set(items.map((i) => i.symbol)), [items]);

  const filtered = useMemo(() => {
    let list = category === "all" ? assets : assets.filter((a) => a.category === category);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q));
    }
    return [...list].sort(SORTERS[sort]);
  }, [assets, category, query, sort]);

  const isConnected = telemetry.state === "connected";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Markets" description="Live streaming quotes across crypto, stocks, ETFs, commodities, and indices." />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            <span className="relative flex size-2">
              {isConnected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />}
              <span className={`relative inline-flex size-2 rounded-full ${isConnected ? "bg-success" : "bg-warning"}`} />
            </span>
            {isConnected ? "LIVE STREAM ACTIVE" : "RECONNECTING"}
          </Badge>
          <Badge variant="secondary" className="hidden font-mono text-xs sm:inline-flex gap-1">
            <Wifi className="size-3" /> {telemetry.latencyMs || 24}ms
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={category} onValueChange={(v) => setCategory(v as AssetCategory | "all")}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            {(Object.keys(CATEGORY_LABELS) as AssetCategory[]).map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex gap-2.5">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets…"
              className="pl-9"
              aria-label="Search assets"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[168px]" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marketCap">Market Cap</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="change">24H Change</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={SearchX} title="No assets found" description="Try adjusting your search or filters." />
      ) : (
        <AssetTable assets={filtered} watchlistSymbols={watchlistSymbols} onToggleWatchlist={toggle} />
      )}
    </div>
  );
}

export default MarketsPage;
