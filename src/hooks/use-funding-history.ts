import { useCallback, useEffect, useState } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as demoStore from "@/lib/demo-store";
import { useAuth } from "@/hooks/use-auth";
import type { FundingTransaction } from "@/types";

export function useFundingHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<FundingTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const txs: FundingTransaction[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch deposits, withdrawals, and profit activities in parallel
        const [depRes, withRes, actRes] = await Promise.all([
          supabase.from("deposit_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("withdrawal_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("activities").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        ]);

        if (depRes.data) {
          for (const d of depRes.data) {
            txs.push({
              id: d.id,
              userId: user.id,
              type: "deposit",
              amount: Number(d.amount),
              status: d.status === "approved" ? "completed" : d.status === "rejected" ? "rejected" : "pending",
              title: `Deposit (${(d.method || "manual").replace("_", " ").toUpperCase()})`,
              description: d.note || `Deposit via ${d.method}`,
              method: d.method,
              createdAt: d.created_at,
              adminNote: d.admin_note,
            });
          }
        }

        if (withRes.data) {
          for (const w of withRes.data) {
            txs.push({
              id: w.id,
              userId: user.id,
              type: "withdrawal",
              amount: Number(w.amount),
              status: w.status === "approved" ? "completed" : w.status === "rejected" ? "rejected" : "pending",
              title: `Withdrawal (${(w.method || "manual").replace("_", " ").toUpperCase()})`,
              description: `Destination: ${w.destination_details || w.destination || "Account"}${w.note ? ` · ${w.note}` : ""}`,
              method: w.method,
              createdAt: w.created_at,
              adminNote: w.admin_note,
            });
          }
        }

        if (actRes.data) {
          for (const a of actRes.data) {
            if (a.type === "profit") {
              txs.push({
                id: a.id,
                userId: user.id,
                type: "profit",
                amount: 0, // parsed from message if available
                status: "completed",
                title: "Profit Credited",
                description: a.message,
                createdAt: a.created_at,
              });
            }
          }
        }

        // Also merge local demo store records in case some are stored locally
        const localTxs = demoStore.getFundingTransactions(user.id);
        for (const ltx of localTxs) {
          if (!txs.some((t) => t.id === ltx.id)) {
            txs.push(ltx);
          }
        }
      } catch (e) {
        console.warn("Falling back to local funding transactions:", e);
        txs.push(...demoStore.getFundingTransactions(user.id));
      }
    } else {
      txs.push(...demoStore.getFundingTransactions(user.id));
    }

    txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setTransactions(txs);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load();

    const handleBalanceEvent = () => load();
    window.addEventListener("marketcapital_balance_updated", handleBalanceEvent);
    return () => {
      window.removeEventListener("marketcapital_balance_updated", handleBalanceEvent);
    };
  }, [load]);

  return { transactions, loading, refresh: load };
}
