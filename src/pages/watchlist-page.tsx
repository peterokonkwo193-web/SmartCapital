import { useEffect, useMemo, useState } from "react";
import { Star, Plus, Search } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { AssetTable } from "@/components/markets/asset-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_LABELS } from "@/data/assets";
import { useLiveMarket } from "@/hooks/use-live-market";
import { useWatchlist } from "@/hooks/use-watchlist";
import type { AssetCategory } from "@/types";

type SortKey = "recent" | "change" | "price" | "name";

function WatchlistPage() {
  const { assets: liveAssets } = useLiveMarket();
  const { items, loading, toggle } = useWatchlist();
  const [sort, setSort] = useState<SortKey>("recent");
  const [category, setCategory] = useState<AssetCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    document.title = "Watchlist — SmartCapital";
  }, []);

  const watchlistSymbols = useMemo(() => new Set(items.map((i) => i.symbol)), [items]);

  const assets = useMemo(() => {
    let list = liveAssets.filter((a) => watchlistSymbols.has(a.symbol));

    if (category !== "all") {
      list = list.filter((a) => a.category === category);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q));
    }

    switch (sort) {
      case "change":
        return [...list].sort((a, b) => b.changePercent24h - a.changePercent24h);
      case "price":
        return [...list].sort((a, b) => b.price - a.price);
      case "name":
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default: {
        const order = new Map(items.map((i, idx) => [i.symbol, idx]));
        return [...list].sort((a, b) => (order.get(a.symbol) ?? 0) - (order.get(b.symbol) ?? 0));
      }
    }
  }, [sort, category, searchQuery, watchlistSymbols, items, liveAssets]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Watchlist"
        description="Track and monitor your favorite live assets."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-1 size-4" /> Add Asset
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={category} onValueChange={(v) => setCategory(v as AssetCategory | "all")} className="w-full sm:w-auto">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            {(Object.keys(CATEGORY_LABELS) as AssetCategory[]).map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search watchlist…"
              className="pl-9 text-xs"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[140px]" aria-label="Sort watchlist">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="change">24H Change</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No matching assets in your watchlist"
          description="Try clearing your filters or add stocks, crypto, ETFs, and more to keep an eye on market price movements."
          action={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-1 size-4" /> Add Asset
            </Button>
          }
        />
      ) : (
        <AssetTable assets={assets} watchlistSymbols={watchlistSymbols} onToggleWatchlist={toggle} />
      )}

      <AddAssetDialog open={addOpen} onOpenChange={setAddOpen} watchlistSymbols={watchlistSymbols} onAdd={toggle} />
    </div>
  );
}

function AddAssetDialog({
  open,
  onOpenChange,
  watchlistSymbols,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watchlistSymbols: Set<string>;
  onAdd: (symbol: string) => void;
}) {
  const [query, setQuery] = useState("");
  const { assets: liveAssets } = useLiveMarket();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? liveAssets.filter((a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q)) : liveAssets;
    return list.slice(0, 30);
  }, [query, liveAssets]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Watchlist</DialogTitle>
          <DialogDescription>Search for an asset to start tracking it.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or ticker…"
            className="pl-9"
          />
        </div>

        <div className="-mx-1 max-h-80 space-y-0.5 overflow-y-auto px-1">
          {results.map((asset) => {
            const added = watchlistSymbols.has(asset.symbol);
            return (
              <button
                key={asset.symbol}
                type="button"
                onClick={() => onAdd(asset.symbol)}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-2.5 text-left transition-colors hover:bg-muted/60"
              >
                <span>
                  <span className="block text-sm font-medium text-foreground">{asset.name}</span>
                  <span className="block text-xs text-muted-foreground">{asset.symbol}</span>
                </span>
                <Star className={added ? "size-4 fill-accent text-accent" : "size-4 text-muted-foreground"} />
              </button>
            );
          })}
          {results.length === 0 && <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">No matches found.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WatchlistPage;
