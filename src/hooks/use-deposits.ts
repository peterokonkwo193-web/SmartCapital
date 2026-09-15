import { useCallback, useEffect, useState } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as demoStore from "@/lib/demo-store";
import { useAuth } from "@/hooks/use-auth";
import type { DepositMethod, DepositRequest } from "@/types";

async function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function useDeposits() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }
    if (isSupabaseConfigured && supabase) {
      try {
        const client = supabase;
        const { data, error } = await client
          .from("deposit_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error || !data) {
          setRequests(demoStore.getDepositRequests(user.id));
        } else {
          const rows = await Promise.all(
            data.map(async (row) => {
              let signedUrl = "";
              try {
                const { data: signed } = await client.storage
                  .from("deposit-proofs")
                  .createSignedUrl(row.proof_image_path, 3600);
                signedUrl = signed?.signedUrl ?? "";
              } catch {
                signedUrl = "";
              }

              const request: DepositRequest = {
                id: row.id,
                userId: row.user_id,
                amount: Number(row.amount),
                method: row.method,
                proofImageUrl: signedUrl,
                note: row.note ?? undefined,
                status: row.status,
                adminNote: row.admin_note ?? undefined,
                createdAt: row.created_at,
                reviewedAt: row.reviewed_at ?? undefined,
                reviewedBy: row.reviewed_by ?? undefined,
              };
              return request;
            }),
          );
          setRequests(rows);
        }
      } catch {
        setRequests(demoStore.getDepositRequests(user.id));
      }
    } else {
      setRequests(demoStore.getDepositRequests(user.id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load();

    const handleBalanceEvent = () => load();
    window.addEventListener("marketcapital_balance_updated", handleBalanceEvent);

    if (isSupabaseConfigured && supabase && user) {
      const client = supabase;
      const channel = client
        .channel(`deposits-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "deposit_requests", filter: `user_id=eq.${user.id}` },
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

  const submitDeposit = useCallback(
    async (input: { amount: number; method: DepositMethod; note?: string; proofImage: File }) => {
      if (!user) throw new Error("You must be signed in to submit a deposit.");

      if (isSupabaseConfigured && supabase) {
        try {
          const path = `${user.id}/${crypto.randomUUID()}-${input.proofImage.name}`;
          const { error: uploadError } = await supabase.storage.from("deposit-proofs").upload(path, input.proofImage);
          if (!uploadError) {
            const { error: insertError } = await supabase.from("deposit_requests").insert({
              user_id: user.id,
              amount: input.amount,
              method: input.method,
              note: input.note || null,
              proof_image_path: path,
            });
            if (!insertError) {
              await load();
              return;
            }
          }
        } catch {
          // Fall back to demoStore
        }
      }

      const dataUrl = await toDataUrl(input.proofImage);
      demoStore.createDepositRequest(user.id, input.amount, input.method, dataUrl, input.note);
      await load();
    },
    [user, load],
  );

  return { requests, loading, submitDeposit };
}
