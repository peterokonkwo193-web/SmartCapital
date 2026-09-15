import { useCallback, useEffect, useState } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as demoStore from "@/lib/demo-store";
import { useAuth } from "@/hooks/use-auth";
import type { WithdrawalMethod, WithdrawalRequest } from "@/types";

export function useWithdrawals() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("withdrawal_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          // If table doesn't exist in Supabase yet, gracefully fall back to demoStore
          console.warn("Supabase withdrawal_requests query fallback to local store:", error.message);
          setRequests(demoStore.getWithdrawalRequests(user.id));
        } else {
          const rows: WithdrawalRequest[] = (data ?? []).map((row) => ({
            id: row.id,
            userId: row.user_id,
            amount: Number(row.amount),
            method: row.method as WithdrawalMethod,
            destinationDetails: row.destination_details ?? row.destination ?? "",
            note: row.note ?? undefined,
            status: row.status,
            adminNote: row.admin_note ?? undefined,
            createdAt: row.created_at,
            reviewedAt: row.reviewed_at ?? undefined,
            reviewedBy: row.reviewed_by ?? undefined,
          }));
          setRequests(rows);
        }
      } catch (err) {
        console.warn("Error loading withdrawals from Supabase:", err);
        setRequests(demoStore.getWithdrawalRequests(user.id));
      }
    } else {
      setRequests(demoStore.getWithdrawalRequests(user.id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load();

    const handleBalanceEvent = () => {
      load();
    };

    window.addEventListener("marketcapital_balance_updated", handleBalanceEvent);

    if (isSupabaseConfigured && supabase && user) {
      const client = supabase;
      const channel = client
        .channel(`withdrawals-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "withdrawal_requests", filter: `user_id=eq.${user.id}` },
          load,
        )
        .subscribe();
      return () => {
        window.removeEventListener("marketcapital_balance_updated", handleBalanceEvent);
        client.removeChannel(channel);
      };
    }

    return () => {
      window.removeEventListener("marketcapital_balance_updated", handleBalanceEvent);
    };
  }, [load, user]);

  const submitWithdrawal = useCallback(
    async (input: { amount: number; method: WithdrawalMethod; destinationDetails: string; note?: string }) => {
      if (!user) throw new Error("You must be signed in to submit a withdrawal request.");

      if (user.practiceBalance < input.amount) {
        throw new Error(
          `Insufficient funds. Your available balance is $${user.practiceBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`,
        );
      }

      if (isSupabaseConfigured && supabase) {
        try {
          // Attempt inserting into Supabase
          const { data, error } = await supabase
            .from("withdrawal_requests")
            .insert({
              user_id: user.id,
              amount: input.amount,
              method: input.method,
              destination_details: input.destinationDetails,
              note: input.note || null,
            })
            .select()
            .single();

          if (!error && data) {
            // Deduct from practice_balance
            const nextBal = Math.max(0, user.practiceBalance - input.amount);
            await supabase.from("profiles").update({ practice_balance: nextBal }).eq("id", user.id);
            try {
              await supabase.from("activities").insert({
                user_id: user.id,
                type: "account",
                message: `Withdrawal request submitted: $${input.amount.toFixed(2)} via ${input.method}`,
              });
            } catch {
              // Non-critical if activity RLS rejects
            }
            window.dispatchEvent(new CustomEvent("marketcapital_balance_updated", { detail: { userId: user.id, balance: nextBal } }));
            await load();
            return;
          }
        } catch {
          // Fall through to demoStore fallback
        }
      }

      // Fallback or demo mode:
      demoStore.createWithdrawalRequest(user.id, input.amount, input.method, input.destinationDetails, input.note);
      await load();
    },
    [user, load],
  );

  return { requests, loading, submitWithdrawal, refresh: load };
}
