import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as demoStore from "@/lib/demo-store";
import { useAuth } from "@/hooks/use-auth";
import { PaperTradingContext, type PaperTradingContextValue } from "@/hooks/paper-trading-context";
import type { OrderSide, OrderType, PaperOrder } from "@/types";

function PaperTradingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PaperOrder[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setBalance(0);
      setLoading(false);
      return;
    }
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from("paper_trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(
        (data ?? []).map((row) => ({
          id: row.id,
          symbol: row.symbol,
          side: row.side,
          type: row.type,
          quantity: row.quantity,
          price: row.price,
          status: row.status,
          createdAt: row.created_at,
        })),
      );
      const { data: profile } = await supabase.from("profiles").select("practice_balance").eq("id", user.id).maybeSingle();
      setBalance(profile?.practice_balance ?? 0);
    } else {
      setOrders(demoStore.getPaperOrders(user.id));
      setBalance(demoStore.getPracticeBalance(user.id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load();

    const handleBalanceUpdate = () => {
      load();
    };
    window.addEventListener("marketcapital_balance_updated", handleBalanceUpdate);
    window.addEventListener("storage", handleBalanceUpdate);

    if (isSupabaseConfigured && supabase && user) {
      const client = supabase;
      const channel = client
        .channel(`paper-trades-${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "paper_trades", filter: `user_id=eq.${user.id}` }, load)
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, load)
        .subscribe();
      return () => {
        window.removeEventListener("marketcapital_balance_updated", handleBalanceUpdate);
        window.removeEventListener("storage", handleBalanceUpdate);
        client.removeChannel(channel);
      };
    }

    return () => {
      window.removeEventListener("marketcapital_balance_updated", handleBalanceUpdate);
      window.removeEventListener("storage", handleBalanceUpdate);
    };
  }, [load, user]);

  const placeOrder = useCallback(
    async (order: { symbol: string; side: OrderSide; type: OrderType; quantity: number; price: number }) => {
      if (!user) throw new Error("You must be signed in to place a trade.");

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from("paper_trades").insert({
          user_id: user.id,
          symbol: order.symbol,
          side: order.side,
          type: order.type,
          quantity: order.quantity,
          price: order.price,
          status: order.type === "market" ? "filled" : "open",
        });
        if (error) throw error;
        await load();
        return;
      }

      const result = demoStore.placePaperOrder(user.id, order);
      setBalance(result.balance);
      await load();
    },
    [user, load],
  );

  const closePosition = useCallback(
    async (symbol: string, currentPrice: number) => {
      if (!user) return;
      if (isSupabaseConfigured && supabase) {
        // Calculate total open quantity
        const filled = orders.filter((o) => o.symbol === symbol && o.status === "filled");
        let qty = 0;
        for (const o of filled) {
          qty += (o.side === "buy" ? 1 : -1) * o.quantity;
        }
        if (qty <= 0) return;

        await supabase.from("paper_trades").insert({
          user_id: user.id,
          symbol,
          side: "sell",
          type: "market",
          quantity: qty,
          price: currentPrice,
          status: "filled",
        });
        const nextBalance = balance + qty * currentPrice;
        await supabase.from("profiles").update({ practice_balance: nextBalance }).eq("id", user.id);
        await load();
        return;
      }

      demoStore.closePosition(user.id, symbol, currentPrice);
      await load();
    },
    [user, orders, balance, load],
  );

  const addPracticeFunds = useCallback(
    async (amount: number) => {
      if (!user) return;
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from("profiles").select("practice_balance").eq("id", user.id).maybeSingle();
        const next = (data?.practice_balance ?? 0) + amount;
        await supabase.from("profiles").update({ practice_balance: next }).eq("id", user.id);
        setBalance(next);
        return;
      }
      const next = demoStore.addPracticeFunds(user.id, amount);
      setBalance(next);
    },
    [user],
  );

  const resetPracticeBalance = useCallback(
    async (targetBalance: number = 0) => {
      if (!user) return;
      if (isSupabaseConfigured && supabase) {
        await supabase.from("profiles").update({ practice_balance: targetBalance }).eq("id", user.id);
        setBalance(targetBalance);
        return;
      }
      const next = demoStore.resetPracticeBalance(user.id, targetBalance);
      setBalance(next);
    },
    [user],
  );

  const value = useMemo<PaperTradingContextValue>(
    () => ({ orders, balance, loading, placeOrder, closePosition, addPracticeFunds, resetPracticeBalance, refresh: load }),
    [orders, balance, loading, placeOrder, closePosition, addPracticeFunds, resetPracticeBalance, load],
  );

  return <PaperTradingContext.Provider value={value}>{children}</PaperTradingContext.Provider>;
}

export { PaperTradingProvider };
