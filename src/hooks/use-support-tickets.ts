import { useCallback, useEffect, useState } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as demoStore from "@/lib/demo-store";
import { useAuth } from "@/hooks/use-auth";
import type { SupportTicket, SupportTicketReply } from "@/types";

export function useSupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [repliesByTicket, setRepliesByTicket] = useState<Record<string, SupportTicketReply[]>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setTickets([]);
      setRepliesByTicket({});
      setLoading(false);
      return;
    }
    if (isSupabaseConfigured && supabase) {
      const [{ data }, { data: replyRows }] = await Promise.all([
        supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        // RLS scopes this to the caller's own non-internal replies — no manual filtering needed.
        supabase.from("support_ticket_replies").select("*, profiles(full_name)").order("created_at", { ascending: true }),
      ]);
      setTickets(
        (data ?? []).map((row) => ({
          id: row.id,
          subject: row.subject,
          message: row.message,
          status: row.status,
          category: row.category,
          createdAt: row.created_at,
        })),
      );
      const grouped: Record<string, SupportTicketReply[]> = {};
      for (const row of replyRows ?? []) {
        const reply: SupportTicketReply = {
          id: row.id,
          ticketId: row.ticket_id,
          authorName: row.profiles?.full_name ?? "Support Team",
          message: row.message,
          isInternal: row.is_internal,
          createdAt: row.created_at,
        };
        (grouped[reply.ticketId] ??= []).push(reply);
      }
      setRepliesByTicket(grouped);
    } else {
      const userTickets = demoStore.getSupportTickets(user.id);
      setTickets(userTickets);
      const grouped: Record<string, SupportTicketReply[]> = {};
      for (const ticket of userTickets) {
        grouped[ticket.id] = demoStore.getTicketReplies(user.id, ticket.id).filter((r) => !r.isInternal);
      }
      setRepliesByTicket(grouped);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load();

    if (isSupabaseConfigured && supabase && user) {
      const client = supabase;
      const channel = client
        .channel(`support-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "support_tickets", filter: `user_id=eq.${user.id}` },
          load,
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "support_ticket_replies" }, load)
        .subscribe();
      return () => {
        client.removeChannel(channel);
      };
    }
  }, [load, user]);

  const createTicket = useCallback(
    async (ticket: { subject: string; message: string; category: string }) => {
      if (!user) throw new Error("You must be signed in to open a ticket.");
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from("support_tickets").insert({ user_id: user.id, ...ticket, status: "open" });
        if (error) throw error;
        await load();
        return;
      }
      demoStore.createSupportTicket(user.id, ticket);
      await load();
    },
    [user, load],
  );

  return { tickets, repliesByTicket, loading, createTicket };
}
