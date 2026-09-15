import { useCallback, useEffect, useState } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as demoStore from "@/lib/demo-store";
import { useAuth } from "@/hooks/use-auth";
import type { WatchlistItem } from "@/types";

export function useWatchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from("watchlist")
        .select("symbol, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setItems((data ?? []).map((row) => ({ symbol: row.symbol, addedAt: row.created_at })));
    } else {
      setItems(demoStore.getWatchlist(user.id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load();

    if (isSupabaseConfigured && supabase && user) {
      const client = supabase;
      const channel = client
        .channel(`watchlist-${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "watchlist", filter: `user_id=eq.${user.id}` }, load)
        .subscribe();
      return () => {
        client.removeChannel(channel);
      };
    }
  }, [load, user]);

  const add = useCallback(
    async (symbol: string) => {
      if (!user) return;
      if (isSupabaseConfigured && supabase) {
        await supabase.from("watchlist").insert({ user_id: user.id, symbol });
      } else {
        demoStore.addToWatchlist(user.id, symbol);
      }
      await load();
    },
    [user, load],
  );

  const remove = useCallback(
    async (symbol: string) => {
      if (!user) return;
      if (isSupabaseConfigured && supabase) {
        await supabase.from("watchlist").delete().eq("user_id", user.id).eq("symbol", symbol);
      } else {
        demoStore.removeFromWatchlist(user.id, symbol);
      }
      await load();
    },
    [user, load],
  );

  const has = useCallback((symbol: string) => items.some((item) => item.symbol === symbol), [items]);

  return { items, loading, add, remove, has, toggle: (symbol: string) => (has(symbol) ? remove(symbol) : add(symbol)) };
}
