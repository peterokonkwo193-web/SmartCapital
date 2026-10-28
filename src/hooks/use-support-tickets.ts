import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as demoStore from "@/lib/demo-store";
import { useAuth } from "@/hooks/use-auth";
import type { SupportTicket, SupportTicketReply } from "@/types";

export function useSupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [repliesByTicket, setRepliesByTicket] = useState<Record<string, SupportTicketReply[]>>({});
  const [loading, setLoading] = useState(true);
  const seenReplyIds = useRef<Set<string> | null>(null);

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
        supabase.from("support_ticket_replies").select("*, profiles(full_name, role)").order("created_at", { ascending: true }),
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
          authorIsAdmin: row.profiles?.role === "admin",
          message: row.message,
          isInternal: row.is_internal,
          createdAt: row.created_at,
        };
        (grouped[reply.ticketId] ??= []).push(reply);
      }
      setRepliesByTicket(grouped);

      // Notify the user (toast, not on first load) when support replies.
      const isFirstLoad = seenReplyIds.current === null;
      if (seenReplyIds.current === null) seenReplyIds.current = new Set();
      for (const replies of Object.values(grouped)) {
        for (const reply of replies) {
          if (!seenReplyIds.current.has(reply.id)) {
            seenReplyIds.current.add(reply.id);
            if (!isFirstLoad && reply.authorIsAdmin) {
              toast.message(`New reply from ${reply.authorName}`, { description: reply.message });
            }
          }
        }
      }
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

  const replyToTicket = useCallback(
    async (ticketId: string, message: string) => {
      if (!user) throw new Error("You must be signed in to reply.");
      const trimmed = message.trim();
      if (!trimmed) throw new Error("Message cannot be empty.");

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from("support_ticket_replies")
          .insert({ ticket_id: ticketId, author_id: user.id, message: trimmed, is_internal: false });
        if (error) throw error;

        const ticket = tickets.find((t) => t.id === ticketId);
        if (ticket && (ticket.status === "resolved" || ticket.status === "closed")) {
          await supabase.from("support_tickets").update({ status: "open" }).eq("id", ticketId);
        }
        await load();
        return;
      }
      demoStore.addTicketReply(user.id, ticketId, trimmed, false, user.fullName || user.email, false);
      await load();
    },
    [user, tickets, load],
  );

  return { tickets, repliesByTicket, loading, createTicket, replyToTicket };
}
