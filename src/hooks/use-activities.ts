import { useCallback, useEffect, useState } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as demoStore from "@/lib/demo-store";
import { useAuth } from "@/hooks/use-auth";
import type { Activity } from "@/types";

export function useActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setActivities(
        (data ?? []).map((row) => ({ id: row.id, type: row.type, message: row.message, createdAt: row.created_at })),
      );
    } else {
      setActivities(demoStore.getActivities(user.id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load();

    const handleUpdate = () => {
      load();
    };
    window.addEventListener("marketcapital_balance_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    if (isSupabaseConfigured && supabase && user) {
      const client = supabase;
      const channel = client
        .channel(`activities-${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "activities", filter: `user_id=eq.${user.id}` }, load)
        .subscribe();
      return () => {
        window.removeEventListener("marketcapital_balance_updated", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
        client.removeChannel(channel);
      };
    }

    return () => {
      window.removeEventListener("marketcapital_balance_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [load, user]);

  return { activities, loading, refresh: load };
}
