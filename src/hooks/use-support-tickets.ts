import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as demoStore from "@/lib/demo-store";
import { useAuth } from "@/hooks/use-auth";
import type { SupportTicket, SupportTicketReply } from "@/types";

const GUEST_ID_KEY = "fxoptions_guest_support_id";

function getEffectiveUserId(signedInUserId?: string): string {
  if (signedInUserId) return signedInUserId;
  try {
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
      guestId = "guest_" + crypto.randomUUID().slice(0, 8);
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return guestId;
  } catch {
    return "guest_user";
  }
}

export function useSupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [repliesByTicket, setRepliesByTicket] = useState<Record<string, SupportTicketReply[]>>({});
  const [loading, setLoading] = useState(true);
  const seenReplyIds = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const effectiveUserId = getEffectiveUserId(user?.id);
    let loadedTickets: SupportTicket[] = [];
    const grouped: Record<string, SupportTicketReply[]> = {};

    // 1. Try Supabase first if available and authenticated
    if (isSupabaseConfigured && supabase && user) {
      try {
        const { data: ticketRows, error: ticketErr } = await supabase
          .from("support_tickets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!ticketErr && ticketRows && ticketRows.length > 0) {
          loadedTickets = ticketRows.map((row) => ({
            id: row.id,
            subject: row.subject,
            message: row.message,
            status: row.status,
            category: row.category,
            createdAt: row.created_at,
          }));

          // Fetch replies safely
          try {
            const { data: replyRows } = await supabase
              .from("support_ticket_replies")
              .select("*")
              .order("created_at", { ascending: true });

            if (replyRows) {
              for (const row of replyRows) {
                const isAdmin = row.author_id !== user.id;
                const reply: SupportTicketReply = {
                  id: row.id,
                  ticketId: row.ticket_id,
                  authorName: isAdmin ? "FXoptions Support Agent" : (user.fullName || "You"),
                  authorIsAdmin: isAdmin,
                  message: row.message,
                  isInternal: Boolean(row.is_internal),
                  createdAt: row.created_at,
                };
                (grouped[reply.ticketId] ??= []).push(reply);
              }
            }
          } catch {
            // Non-fatal if reply query fails
          }
        }
      } catch {
        // Fall through to demoStore
      }
    }

    // 2. Merge with local demoStore tickets
    try {
      const localTickets = demoStore.getSupportTickets(effectiveUserId);
      for (const lt of localTickets) {
        if (!loadedTickets.some((t) => t.id === lt.id)) {
          loadedTickets.push(lt);
        }
        const localReplies = demoStore.getTicketReplies(effectiveUserId, lt.id).filter((r) => !r.isInternal);
        if (localReplies.length > 0) {
          const existingList = grouped[lt.id] ?? [];
          for (const lr of localReplies) {
            if (!existingList.some((r) => r.id === lr.id)) {
              existingList.push(lr);
            }
          }
          grouped[lt.id] = existingList;
        }
      }
    } catch {
      // Storage error ignored
    }

    setTickets(loadedTickets);
    setRepliesByTicket(grouped);

    // Notify user on new admin replies (except initial load)
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
      const effectiveUserId = getEffectiveUserId(user?.id);

      if (isSupabaseConfigured && supabase && user) {
        try {
          await supabase
            .from("support_tickets")
            .insert({ user_id: user.id, ...ticket, status: "open" });
        } catch {
          // Fall through to local store
        }
      }

      // Always create in demoStore as persistent backup & instant UI update
      const localTicket = demoStore.createSupportTicket(effectiveUserId, ticket);

      // Automated acknowledgment from FXoptions customer service
      setTimeout(() => {
        try {
          demoStore.addTicketReply(
            effectiveUserId,
            localTicket.id,
            "Hello! Thank you for contacting FXoptions Customer Service. A dedicated agent has been assigned to your inquiry and will assist you shortly.",
            false,
            "FXoptions Support Desk",
            true,
          );
          load();
        } catch {}
      }, 1200);

      await load();
    },
    [user, load],
  );

  const replyToTicket = useCallback(
    async (ticketId: string, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) throw new Error("Message cannot be empty.");
      const effectiveUserId = getEffectiveUserId(user?.id);
      const authorName = user?.fullName || user?.email || "Client";

      if (isSupabaseConfigured && supabase && user) {
        try {
          const { error } = await supabase
            .from("support_ticket_replies")
            .insert({ ticket_id: ticketId, author_id: user.id, message: trimmed, is_internal: false });

          if (!error) {
            const ticket = tickets.find((t) => t.id === ticketId);
            if (ticket && (ticket.status === "resolved" || ticket.status === "closed")) {
              await supabase.from("support_tickets").update({ status: "open" }).eq("id", ticketId);
            }
          }
        } catch {
          // Fall through to demoStore
        }
      }

      demoStore.addTicketReply(effectiveUserId, ticketId, trimmed, false, authorName, false);
      await load();
    },
    [user, tickets, load],
  );

  return { tickets, repliesByTicket, loading, createTicket, replyToTicket };
}
