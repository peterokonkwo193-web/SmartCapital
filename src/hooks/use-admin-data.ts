import { useCallback, useEffect, useState } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as demoStore from "@/lib/demo-store";
import { useAuth } from "@/hooks/use-auth";
import type {
  AuditLogEntry,
  DepositRequest,
  PaperOrder,
  Profile,
  ProfitPayoutRecord,
  SupportTicket,
  SupportTicketReply,
  WithdrawalMethod,
  WithdrawalRequest,
} from "@/types";

export interface AdminUserRow extends Profile {}
export interface AdminOrderRow {
  userId: string;
  userName: string;
  order: PaperOrder;
}
export interface AdminTicketRow {
  userId: string;
  userName: string;
  userEmail: string;
  ticket: SupportTicket;
}
export interface AdminDepositRow {
  userId: string;
  userName: string;
  userEmail: string;
  request: DepositRequest;
}
export interface AdminWithdrawalRow {
  userId: string;
  userName: string;
  userEmail: string;
  request: WithdrawalRequest;
}

export function useAdminData() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [tickets, setTickets] = useState<AdminTicketRow[]>([]);
  const [repliesByTicket, setRepliesByTicket] = useState<Record<string, SupportTicketReply[]>>({});
  const [deposits, setDeposits] = useState<AdminDepositRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRow[]>([]);
  const [profitPayouts, setProfitPayouts] = useState<ProfitPayoutRecord[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const [
        { data: profiles },
        { data: paperTrades },
        { data: supportTickets },
        { data: replyRows },
        { data: depositRows },
        { data: audit },
      ] = await Promise.all([
        client.from("profiles").select("*").order("created_at", { ascending: false }),
        client.from("paper_trades").select("*, profiles(full_name)"),
        client.from("support_tickets").select("*, profiles(full_name, email)"),
        client.from("support_ticket_replies").select("*, profiles(full_name)").order("created_at", { ascending: true }),
        client.from("deposit_requests").select("*, profiles(full_name, email)").order("created_at", { ascending: false }),
        client.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100),
      ]);

      const mappedUsers: AdminUserRow[] = (profiles ?? []).map((p) => ({
        id: p.id,
        fullName: p.full_name,
        firstName: p.first_name ?? "",
        lastName: p.last_name ?? "",
        phone: p.phone ?? "",
        country: p.country ?? "",
        email: p.email,
        memberSince: p.created_at,
        practiceBalance: Number(p.practice_balance ?? 0),
        role: p.role ?? "user",
        disabled: p.disabled ?? false,
      }));
      setUsers(mappedUsers);

      setOrders(
        (paperTrades ?? []).map((row: any) => ({
          userId: row.user_id,
          userName: row.profiles?.full_name ?? "Unknown",
          order: {
            id: row.id,
            symbol: row.symbol,
            side: row.side,
            type: row.type,
            quantity: row.quantity,
            price: row.price,
            status: row.status,
            createdAt: row.created_at,
          },
        })),
      );

      setTickets(
        (supportTickets ?? []).map((row: any) => ({
          userId: row.user_id,
          userName: row.profiles?.full_name ?? "Unknown",
          userEmail: row.profiles?.email ?? "",
          ticket: {
            id: row.id,
            subject: row.subject,
            message: row.message,
            status: row.status,
            category: row.category,
            createdAt: row.created_at,
          },
        })),
      );

      const grouped: Record<string, SupportTicketReply[]> = {};
      for (const row of replyRows ?? []) {
        const reply: SupportTicketReply = {
          id: row.id,
          ticketId: row.ticket_id,
          authorName: (row as any).profiles?.full_name ?? "Support Team",
          message: row.message,
          isInternal: row.is_internal,
          createdAt: row.created_at,
        };
        (grouped[reply.ticketId] ??= []).push(reply);
      }
      setRepliesByTicket(grouped);

      // Deposits: process Supabase results or combine with local
      let loadedDeposits: AdminDepositRow[] = [];
      if (depositRows && Array.isArray(depositRows)) {
        loadedDeposits = await Promise.all(
          depositRows.map(async (row: any) => {
            let signedUrl = "";
            try {
              const { data: signed } = await client.storage.from("deposit-proofs").createSignedUrl(row.proof_image_path, 3600);
              signedUrl = signed?.signedUrl ?? "";
            } catch {
              signedUrl = "";
            }

            return {
              userId: row.user_id,
              userName: row.profiles?.full_name ?? "Unknown",
              userEmail: row.profiles?.email ?? "",
              request: {
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
              },
            };
          }),
        );
      }

      // Merge local deposit requests if any
      const localDeposits = demoStore.getAllDepositRequests();
      for (const ld of localDeposits) {
        if (!loadedDeposits.some((d) => d.request.id === ld.request.id)) {
          loadedDeposits.push(ld);
        }
      }
      setDeposits(loadedDeposits);

      // Withdrawals: load from Supabase or fallback to local
      let loadedWithdrawals: AdminWithdrawalRow[] = [];
      try {
        const { data: withData } = await client
          .from("withdrawal_requests")
          .select("*, profiles(full_name, email)")
          .order("created_at", { ascending: false });

        if (withData && Array.isArray(withData)) {
          loadedWithdrawals = withData.map((row: any) => ({
            userId: row.user_id,
            userName: row.profiles?.full_name ?? "Client",
            userEmail: row.profiles?.email ?? "",
            request: {
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
            },
          }));
        }
      } catch {
        // Table not present yet
      }

      const localWithdrawals = demoStore.getAllWithdrawalRequests();
      for (const lw of localWithdrawals) {
        if (!loadedWithdrawals.some((w) => w.request.id === lw.request.id)) {
          loadedWithdrawals.push(lw);
        }
      }
      setWithdrawals(loadedWithdrawals);

      // Profits
      setProfitPayouts(demoStore.getAllProfitPayouts());

      setAuditLog(
        (audit ?? []).map((row: any) => ({
          id: row.id,
          actor: row.actor,
          action: row.action,
          target: row.target,
          createdAt: row.created_at,
        })),
      );
    } else {
      const allTickets = demoStore.getAllSupportTickets();
      setUsers(demoStore.getAllDemoProfiles());
      setOrders(demoStore.getAllPaperOrders());
      setTickets(allTickets);
      const grouped: Record<string, SupportTicketReply[]> = {};
      for (const { userId, ticket } of allTickets) {
        grouped[ticket.id] = demoStore.getTicketReplies(userId, ticket.id);
      }
      setRepliesByTicket(grouped);
      setDeposits(demoStore.getAllDepositRequests());
      setWithdrawals(demoStore.getAllWithdrawalRequests());
      setProfitPayouts(demoStore.getAllProfitPayouts());
      setAuditLog(demoStore.getAuditLog());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const setUserEnabled = useCallback(
    async (userId: string, enabled: boolean) => {
      const actor = user?.email ?? "admin";
      if (isSupabaseConfigured && supabase) {
        await supabase.from("profiles").update({ disabled: !enabled }).eq("id", userId);
        await supabase.from("audit_logs").insert({ actor, action: enabled ? "Enabled user" : "Disabled user", target: userId });
      } else {
        demoStore.setUserEnabled(userId, enabled, actor);
      }
      await load();
    },
    [user, load],
  );

  const setUserRole = useCallback(
    async (userId: string, role: Profile["role"]) => {
      const actor = user?.email ?? "admin";
      if (isSupabaseConfigured && supabase) {
        await supabase.from("profiles").update({ role }).eq("id", userId);
        await supabase.from("audit_logs").insert({ actor, action: `Set role to ${role}`, target: userId });
      } else {
        demoStore.setUserRole(userId, role, actor);
      }
      await load();
    },
    [user, load],
  );

  const adjustPracticeBalance = useCallback(
    async (userId: string, newBalance: number, reason: string) => {
      const actor = user?.email ?? "admin";
      if (!reason.trim()) throw new Error("A reason is mandatory for balance adjustments.");

      demoStore.adjustBalanceWithAudit(userId, newBalance, reason, actor);

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: targetProfile } = await supabase.from("profiles").select("practice_balance, email").eq("id", userId).single();
          const oldBal = Number(targetProfile?.practice_balance ?? 0);
          const adj = newBalance - oldBal;
          await supabase.from("profiles").update({ practice_balance: newBalance }).eq("id", userId);
          const actionDesc = `Balance Adjustment: Old=$${oldBal.toFixed(2)}, New=$${newBalance.toFixed(2)}, Adj=$${adj >= 0 ? "+" : ""}$${adj.toFixed(2)} (Reason: ${reason})`;
          await supabase.from("audit_logs").insert({ actor, action: actionDesc, target: targetProfile?.email ?? userId });
          window.dispatchEvent(new CustomEvent("marketcapital_balance_updated", { detail: { userId, newBalance } }));
        } catch (e) {
          console.warn("Supabase balance adjust sync:", e);
        }
      }
      await load();
    },
    [user, load],
  );

  const creditProfit = useCallback(
    async (userId: string, amount: number, payoutType: string, reason: string) => {
      const actor = user?.email ?? "admin";
      if (!amount || amount <= 0) throw new Error("Profit amount must be greater than zero.");

      // Record in local store
      demoStore.creditProfitWithAudit(userId, amount, payoutType, reason, actor);

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: targetProfile } = await supabase.from("profiles").select("practice_balance, email").eq("id", userId).single();
          const oldBal = Number(targetProfile?.practice_balance ?? 0);
          const newBal = oldBal + amount;
          await supabase.from("profiles").update({ practice_balance: newBal }).eq("id", userId);

          try {
            await supabase.from("activities").insert({
              user_id: userId,
              type: "profit",
              message: `Profit Payout: +$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} credited (${payoutType}${reason ? ` · ${reason}` : ""})`,
            });
          } catch {
            // Activities insert might be restricted by user RLS
          }

          const actionDesc = `Credited Profit: +$${amount.toFixed(2)} (${payoutType}) - Reason: ${reason}`;
          await supabase.from("audit_logs").insert({ actor, action: actionDesc, target: targetProfile?.email ?? userId });
          window.dispatchEvent(new CustomEvent("marketcapital_balance_updated", { detail: { userId, balance: newBal } }));
        } catch (err) {
          console.warn("Supabase profit credit:", err);
        }
      }
      await load();
    },
    [user, load],
  );

  const correctTrade = useCallback(
    async (userId: string, orderId: string, newPrice: number, newQty: number, reason: string) => {
      const actor = user?.email ?? "admin";
      if (!reason.trim()) throw new Error("A reason is mandatory for trade corrections.");
      if (isSupabaseConfigured && supabase) {
        const { data: targetOrder } = await supabase.from("paper_trades").select("*").eq("id", orderId).single();
        if (targetOrder) {
          await supabase.from("paper_trades").update({ price: newPrice, quantity: newQty }).eq("id", orderId);
          const actionDesc = `Order Correction (${targetOrder.symbol}): Price Old=$${targetOrder.price}, New=$${newPrice}; Qty Old=${targetOrder.quantity}, New=${newQty} (Reason: ${reason})`;
          await supabase.from("audit_logs").insert({ actor, action: actionDesc, target: `User ID: ${userId} [Order #${orderId.slice(0, 8)}]` });
        }
      } else {
        demoStore.correctOrderWithAudit(userId, orderId, newPrice, newQty, reason, actor);
      }
      await load();
    },
    [user, load],
  );

  const updateTicketStatus = useCallback(
    async (userId: string, ticketId: string, status: SupportTicket["status"]) => {
      const actor = user?.email ?? "admin";
      if (isSupabaseConfigured && supabase) {
        await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
        await supabase.from("audit_logs").insert({ actor, action: `Marked ticket as ${status}`, target: ticketId });
      } else {
        demoStore.updateSupportTicketStatus(userId, ticketId, status, actor);
      }
      await load();
    },
    [user, load],
  );

  const addTicketReply = useCallback(
    async (userId: string, ticketId: string, message: string, isInternal: boolean) => {
      if (!message.trim()) throw new Error("Reply message cannot be empty.");
      const actor = user?.email ?? "admin";
      if (isSupabaseConfigured && supabase) {
        if (!user) throw new Error("You must be signed in.");
        const { error } = await supabase
          .from("support_ticket_replies")
          .insert({ ticket_id: ticketId, author_id: user.id, message, is_internal: isInternal });
        if (error) throw error;
        await supabase
          .from("audit_logs")
          .insert({ actor, action: isInternal ? "Added internal note to ticket" : "Replied to ticket", target: ticketId });
      } else {
        demoStore.addTicketReply(userId, ticketId, message, isInternal, actor);
      }
      await load();
    },
    [user, load],
  );

  const cancelOrder = useCallback(
    async (userId: string, orderId: string) => {
      const actor = user?.email ?? "admin";
      if (isSupabaseConfigured && supabase) {
        await supabase.from("paper_trades").update({ status: "cancelled" }).eq("id", orderId).eq("status", "open");
        await supabase.from("audit_logs").insert({ actor, action: "Cancelled open paper order", target: orderId });
      } else {
        demoStore.adminCancelOrder(userId, orderId, actor);
      }
      await load();
    },
    [user, load],
  );

  const reviewDeposit = useCallback(
    async (userId: string, requestId: string, approve: boolean, adminNote: string | undefined) => {
      const actor = user?.email ?? "admin";
      if (!approve && !adminNote?.trim()) throw new Error("A reason is mandatory when rejecting a deposit request.");

      let reviewedOnSupabase = false;
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: request } = await supabase.from("deposit_requests").select("*").eq("id", requestId).single();
          if (request && request.status === "pending") {
            await supabase
              .from("deposit_requests")
              .update({
                status: approve ? "approved" : "rejected",
                admin_note: adminNote || null,
                reviewed_at: new Date().toISOString(),
                reviewed_by: actor,
              })
              .eq("id", requestId);

            if (approve) {
              const { data: profile } = await supabase.from("profiles").select("practice_balance, email").eq("id", userId).single();
              const nextBalance = Number(profile?.practice_balance ?? 0) + Number(request.amount);
              await supabase.from("profiles").update({ practice_balance: nextBalance }).eq("id", userId);
              try {
                await supabase.from("activities").insert({
                  user_id: userId,
                  type: "account",
                  message: `Deposit of $${Number(request.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} approved — funds credited to your account.`,
                });
              } catch {
                // Ignore activity RLS issue
              }
              await supabase.from("audit_logs").insert({
                actor,
                action: `Approved deposit request of $${Number(request.amount).toFixed(2)}${adminNote ? ` (Note: ${adminNote})` : ""}`,
                target: profile?.email ?? userId,
              });
              window.dispatchEvent(new CustomEvent("marketcapital_balance_updated", { detail: { userId, newBalance: nextBalance } }));
            } else {
              await supabase.from("audit_logs").insert({
                actor,
                action: `Rejected deposit request of $${Number(request.amount).toFixed(2)} (Note: ${adminNote})`,
                target: userId,
              });
            }
            reviewedOnSupabase = true;
          }
        } catch (e) {
          console.warn("Supabase deposit review fallback:", e);
        }
      }

      if (!reviewedOnSupabase) {
        demoStore.reviewDepositRequest(userId, requestId, approve, adminNote, actor);
      }

      await load();
    },
    [user, load],
  );

  const reviewWithdrawal = useCallback(
    async (userId: string, requestId: string, approve: boolean, adminNote: string | undefined) => {
      const actor = user?.email ?? "admin";
      if (!approve && !adminNote?.trim()) throw new Error("A reason is mandatory when rejecting a withdrawal request.");

      let reviewedOnSupabase = false;
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: request } = await supabase.from("withdrawal_requests").select("*").eq("id", requestId).single();
          if (request && request.status === "pending") {
            await supabase
              .from("withdrawal_requests")
              .update({
                status: approve ? "approved" : "rejected",
                admin_note: adminNote || null,
                reviewed_at: new Date().toISOString(),
                reviewed_by: actor,
              })
              .eq("id", requestId);

            if (!approve) {
              // Refund held balance back to user
              const { data: profile } = await supabase.from("profiles").select("practice_balance, email").eq("id", userId).single();
              const refundedBalance = Number(profile?.practice_balance ?? 0) + Number(request.amount);
              await supabase.from("profiles").update({ practice_balance: refundedBalance }).eq("id", userId);
              await supabase.from("audit_logs").insert({
                actor,
                action: `Rejected withdrawal request of $${Number(request.amount).toFixed(2)} (Refunded) - Reason: ${adminNote}`,
                target: profile?.email ?? userId,
              });
              window.dispatchEvent(new CustomEvent("marketcapital_balance_updated", { detail: { userId, newBalance: refundedBalance } }));
            } else {
              const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).single();
              await supabase.from("audit_logs").insert({
                actor,
                action: `Approved and processed withdrawal of $${Number(request.amount).toFixed(2)} (${request.method})${adminNote ? ` (Note: ${adminNote})` : ""}`,
                target: profile?.email ?? userId,
              });
            }
            reviewedOnSupabase = true;
          }
        } catch (e) {
          console.warn("Supabase withdrawal review fallback:", e);
        }
      }

      if (!reviewedOnSupabase) {
        demoStore.reviewWithdrawalRequest(userId, requestId, approve, adminNote, actor);
      }

      await load();
    },
    [user, load],
  );

  return {
    users,
    orders,
    tickets,
    repliesByTicket,
    deposits,
    withdrawals,
    profitPayouts,
    auditLog,
    loading,
    setUserEnabled,
    setUserRole,
    adjustPracticeBalance,
    creditProfit,
    correctTrade,
    updateTicketStatus,
    addTicketReply,
    cancelOrder,
    reviewDeposit,
    reviewWithdrawal,
    refresh: load,
  };
}
