import type {
  Activity,
  AuditLogEntry,
  DepositRequest,
  PaperOrder,
  Profile,
  SupportTicket,
  SupportTicketReply,
  WatchlistItem,
} from "@/types";
import { DEMO_POSITIONS } from "@/data/portfolio";

const NS = "smartcapital";

interface DemoCredential {
  userId: string;
  email: string;
  passwordHash: string;
}

interface DemoUserData {
  profile: Profile;
  watchlist: WatchlistItem[];
  paperOrders: PaperOrder[];
  activities: Activity[];
  supportTickets: SupportTicket[];
  ticketReplies: Record<string, SupportTicketReply[]>;
  depositRequests: DepositRequest[];
  practiceBalance: number;
}

function key(suffix: string): string {
  return `${NS}:${suffix}`;
}

function readJSON<T>(storageKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(storageKey: string, value: T): void {
  localStorage.setItem(storageKey, JSON.stringify(value));
}

async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getCredentials(): DemoCredential[] {
  return readJSON<DemoCredential[]>(key("credentials"), []);
}

function getUserData(userId: string): DemoUserData | null {
  return readJSON<DemoUserData | null>(key(`user:${userId}`), null);
}

function saveUserData(userId: string, data: DemoUserData): void {
  writeJSON(key(`user:${userId}`), data);
}

function seedUserData(
  userId: string,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  country: string,
): DemoUserData {
  const now = new Date().toISOString();
  const data: DemoUserData = {
    profile: {
      id: userId,
      fullName: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      phone,
      country,
      email,
      memberSince: now,
      practiceBalance: 0,
      // Every demo signup starts as a regular user. Local demo mode has no server to
      // enforce RBAC, so admin access is granted explicitly and visibly per-account via
      // grantDemoAdmin() (Profile → Security) rather than inferred from a credential.
      // The Supabase-backed path grants admin via the `role` column (see
      // supabase/schema.sql), gated by RLS — never by anything client-known.
      role: "user",
    },
    watchlist: [
      { symbol: "AAPL", addedAt: now },
      { symbol: "BTC", addedAt: now },
      { symbol: "SPY", addedAt: now },
    ],
    paperOrders: DEMO_POSITIONS.slice(0, 4).map((pos, i) => ({
      id: crypto.randomUUID(),
      symbol: pos.symbol,
      side: "buy" as const,
      type: "market" as const,
      quantity: pos.quantity,
      price: pos.avgCost,
      status: "filled" as const,
      createdAt: new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString(),
    })),
    activities: [{ id: crypto.randomUUID(), type: "account", message: "Account created", createdAt: now }],
    supportTickets: [],
    ticketReplies: {},
    depositRequests: [],
    practiceBalance: 0,
  };
  saveUserData(userId, data);
  return data;
}

export async function registerDemoUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phone: string,
  country: string,
): Promise<Profile> {
  const credentials = getCredentials();
  if (credentials.some((c) => c.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  credentials.push({ userId, email, passwordHash });
  writeJSON(key("credentials"), credentials);
  const data = seedUserData(userId, firstName, lastName, email, phone, country);
  setActiveSession(userId);
  return data.profile;
}

export async function loginDemoUser(email: string, password: string): Promise<Profile> {
  const credentials = getCredentials();
  const match = credentials.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (!match) throw new Error("No account found with this email.");
  const passwordHash = await hashPassword(password);
  if (match.passwordHash !== passwordHash) throw new Error("Incorrect password.");
  const data = getUserData(match.userId);
  if (!data) throw new Error("Account data could not be found.");
  setActiveSession(match.userId);
  return data.profile;
}

export async function changeDemoPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const credentials = getCredentials();
  const record = credentials.find((c) => c.userId === userId);
  if (!record) throw new Error("Account not found.");

  const currentHash = await hashPassword(currentPassword);
  if (record.passwordHash !== currentHash) throw new Error("Current password is incorrect.");

  record.passwordHash = await hashPassword(newPassword);
  writeJSON(key("credentials"), credentials);
  logActivity(userId, "account", "Password changed");
}

export function setActiveSession(userId: string | null): void {
  if (userId) writeJSON(key("session"), userId);
  else localStorage.removeItem(key("session"));
}

export function getActiveSessionUserId(): string | null {
  return readJSON<string | null>(key("session"), null);
}

export function getActiveProfile(): Profile | null {
  const userId = getActiveSessionUserId();
  if (!userId) return null;
  return getUserData(userId)?.profile ?? null;
}

export function grantDemoAdmin(userId: string): Profile {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");
  data.profile.role = "admin";
  saveUserData(userId, data);
  logActivity(userId, "account", "Granted admin access");
  logAuditEvent(data.profile.email, "Granted admin access via account settings", data.profile.email);
  return data.profile;
}

export function revokeDemoAdmin(userId: string): Profile {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");
  data.profile.role = "user";
  saveUserData(userId, data);
  logActivity(userId, "account", "Revoked admin access");
  logAuditEvent(data.profile.email, "Revoked admin access via account settings", data.profile.email);
  return data.profile;
}

export function updateProfile(userId: string, patch: Partial<Profile>): Profile {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");
  data.profile = { ...data.profile, ...patch };
  saveUserData(userId, data);
  return data.profile;
}

export function getWatchlist(userId: string): WatchlistItem[] {
  return getUserData(userId)?.watchlist ?? [];
}

export function addToWatchlist(userId: string, symbol: string): WatchlistItem[] {
  const data = getUserData(userId);
  if (!data) return [];
  if (!data.watchlist.some((w) => w.symbol === symbol)) {
    data.watchlist.push({ symbol, addedAt: new Date().toISOString() });
    logActivity(userId, "watchlist", `Added ${symbol} to watchlist`);
  }
  saveUserData(userId, data);
  return data.watchlist;
}

export function removeFromWatchlist(userId: string, symbol: string): WatchlistItem[] {
  const data = getUserData(userId);
  if (!data) return [];
  data.watchlist = data.watchlist.filter((w) => w.symbol !== symbol);
  saveUserData(userId, data);
  return data.watchlist;
}

export function getPaperOrders(userId: string): PaperOrder[] {
  return getUserData(userId)?.paperOrders ?? [];
}

export function getPracticeBalance(userId: string): number {
  return getUserData(userId)?.practiceBalance ?? 0;
}

export function placePaperOrder(
  userId: string,
  order: Omit<PaperOrder, "id" | "createdAt" | "status">,
): { order: PaperOrder; balance: number } {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");

  const cost = order.quantity * order.price;
  if (order.side === "buy" && cost > data.practiceBalance) {
    throw new Error("Insufficient account balance for this order.");
  }

  const newOrder: PaperOrder = {
    ...order,
    id: crypto.randomUUID(),
    status: order.type === "market" ? "filled" : "open",
    createdAt: new Date().toISOString(),
  };

  data.paperOrders = [newOrder, ...data.paperOrders];
  if (newOrder.status === "filled") {
    data.practiceBalance += order.side === "buy" ? -cost : cost;
  }
  saveUserData(userId, data);
  logActivity(
    userId,
    "trade",
    `${order.side === "buy" ? "Bought" : "Sold"} ${order.quantity} ${order.symbol} (${order.type.toUpperCase()})`,
  );

  return { order: newOrder, balance: data.practiceBalance };
}

export function addPracticeFunds(userId: string, amount: number): number {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");
  data.practiceBalance += amount;
  saveUserData(userId, data);
  logActivity(userId, "account", `Added ${amount.toLocaleString("en-US", { style: "currency", currency: "USD" })} to account balance`);
  return data.practiceBalance;
}

export function getActivities(userId: string): Activity[] {
  return getUserData(userId)?.activities ?? [];
}

export function logActivity(userId: string, type: Activity["type"], message: string): void {
  const data = getUserData(userId);
  if (!data) return;
  data.activities = [{ id: crypto.randomUUID(), type, message, createdAt: new Date().toISOString() }, ...data.activities].slice(0, 50);
  saveUserData(userId, data);
}

export function getSupportTickets(userId: string): SupportTicket[] {
  return getUserData(userId)?.supportTickets ?? [];
}

export function createSupportTicket(
  userId: string,
  ticket: Omit<SupportTicket, "id" | "status" | "createdAt">,
): SupportTicket {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");
  const newTicket: SupportTicket = {
    ...ticket,
    id: crypto.randomUUID(),
    status: "open",
    createdAt: new Date().toISOString(),
  };
  data.supportTickets = [newTicket, ...data.supportTickets];
  saveUserData(userId, data);
  logActivity(userId, "support", `Opened support ticket: ${ticket.subject}`);
  return newTicket;
}

export function getTicketReplies(userId: string, ticketId: string): SupportTicketReply[] {
  const data = getUserData(userId);
  return data?.ticketReplies?.[ticketId] ?? [];
}

export function addTicketReply(
  userId: string,
  ticketId: string,
  message: string,
  isInternal: boolean,
  authorName: string,
): SupportTicketReply {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");
  if (!data.ticketReplies) data.ticketReplies = {};

  const reply: SupportTicketReply = {
    id: crypto.randomUUID(),
    ticketId,
    authorName,
    message,
    isInternal,
    createdAt: new Date().toISOString(),
  };
  data.ticketReplies[ticketId] = [...(data.ticketReplies[ticketId] ?? []), reply];
  saveUserData(userId, data);

  const ticketSubject = data.supportTickets.find((t) => t.id === ticketId)?.subject ?? ticketId;
  logAuditEvent(authorName, isInternal ? `Added internal note to ticket` : `Replied to ticket`, ticketSubject);
  return reply;
}

export function getDepositRequests(userId: string): DepositRequest[] {
  return getUserData(userId)?.depositRequests ?? [];
}

export function createDepositRequest(
  userId: string,
  amount: number,
  method: DepositRequest["method"],
  proofImageUrl: string,
  note: string | undefined,
): DepositRequest {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");
  if (!data.depositRequests) data.depositRequests = [];

  const request: DepositRequest = {
    id: crypto.randomUUID(),
    amount,
    method,
    proofImageUrl,
    note,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  data.depositRequests = [request, ...data.depositRequests];
  saveUserData(userId, data);
  logActivity(userId, "account", `Submitted a deposit request for $${amount.toFixed(2)}`);
  return request;
}

export function reviewDepositRequest(
  userId: string,
  requestId: string,
  approve: boolean,
  adminNote: string | undefined,
  actor: string,
): void {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");
  if (!data.depositRequests) data.depositRequests = [];

  const request = data.depositRequests.find((r) => r.id === requestId);
  if (!request) throw new Error("Deposit request not found.");
  if (request.status !== "pending") throw new Error("This deposit request has already been reviewed.");

  request.status = approve ? "approved" : "rejected";
  request.adminNote = adminNote;
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = actor;

  if (approve) {
    data.practiceBalance += request.amount;
    data.profile.practiceBalance = data.practiceBalance;
    logActivity(userId, "account", `Deposit of $${request.amount.toFixed(2)} approved (funds credited)`);
  } else {
    logActivity(userId, "account", `Deposit of $${request.amount.toFixed(2)} rejected`);
  }
  saveUserData(userId, data);

  logAuditEvent(
    actor,
    `${approve ? "Approved" : "Rejected"} deposit request of $${request.amount.toFixed(2)}${adminNote ? ` (Note: ${adminNote})` : ""}`,
    data.profile.email,
  );
}

export function getAllDepositRequests(): { userId: string; userName: string; userEmail: string; request: DepositRequest }[] {
  return getAllDemoUserData().flatMap(({ userId, profile, data }) =>
    (data.depositRequests ?? []).map((request) => ({ userId, userName: profile.fullName, userEmail: profile.email, request })),
  );
}

export function getAllDemoProfiles(): Profile[] {
  return getCredentials()
    .map((c) => getUserData(c.userId)?.profile)
    .filter((p): p is Profile => Boolean(p));
}

export function getAllDemoUserData(): { userId: string; profile: Profile; data: DemoUserData }[] {
  return getCredentials()
    .map((c) => {
      const data = getUserData(c.userId);
      return data ? { userId: c.userId, profile: data.profile, data } : null;
    })
    .filter((entry): entry is { userId: string; profile: Profile; data: DemoUserData } => Boolean(entry));
}

export function getAllPaperOrders(): { userId: string; userName: string; order: PaperOrder }[] {
  return getAllDemoUserData().flatMap(({ userId, profile, data }) =>
    data.paperOrders.map((order) => ({ userId, userName: profile.fullName, order })),
  );
}

export function getAllSupportTickets(): { userId: string; userName: string; userEmail: string; ticket: SupportTicket }[] {
  return getAllDemoUserData().flatMap(({ userId, profile, data }) =>
    data.supportTickets.map((ticket) => ({ userId, userName: profile.fullName, userEmail: profile.email, ticket })),
  );
}

export function setUserEnabled(userId: string, enabled: boolean, actor: string): void {
  const data = getUserData(userId);
  if (!data) return;
  data.profile.disabled = !enabled;
  saveUserData(userId, data);
  logAuditEvent(actor, enabled ? "Enabled user" : "Disabled user", data.profile.email);
}

export function setUserRole(userId: string, role: Profile["role"], actor: string): void {
  const data = getUserData(userId);
  if (!data) return;
  data.profile.role = role;
  saveUserData(userId, data);
  logAuditEvent(actor, `Set role to ${role}`, data.profile.email);
}

export function resetPracticeBalance(userId: string, targetBalance: number = 0): number {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");
  data.practiceBalance = targetBalance;
  saveUserData(userId, data);
  logActivity(userId, "account", `Reset account balance to ${targetBalance.toLocaleString("en-US", { style: "currency", currency: "USD" })}`);
  return data.practiceBalance;
}

export function closePosition(userId: string, symbol: string, exitPrice: number): number {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");

  const filledOrders = data.paperOrders.filter((o) => o.symbol === symbol && o.status === "filled");
  let qty = 0;
  for (const o of filledOrders) {
    qty += (o.side === "buy" ? 1 : -1) * o.quantity;
  }

  if (qty <= 0) throw new Error("No open position to close.");

  const sellOrder: PaperOrder = {
    id: crypto.randomUUID(),
    symbol,
    side: "sell",
    type: "market",
    quantity: qty,
    price: exitPrice,
    status: "filled",
    createdAt: new Date().toISOString(),
  };

  data.paperOrders = [sellOrder, ...data.paperOrders];
  data.practiceBalance += qty * exitPrice;
  saveUserData(userId, data);
  logActivity(userId, "trade", `Closed position in ${symbol} at $${exitPrice.toFixed(2)}`);
  return data.practiceBalance;
}

export function creditProfitWithAudit(
  userId: string,
  amount: number,
  payoutType: string,
  reason: string,
  actor: string,
): { newBalance: number } {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");

  const oldBalance = data.practiceBalance;
  data.practiceBalance += amount;
  data.profile.practiceBalance = data.practiceBalance;

  const activityMessage = `Profit Payout: +$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} credited (${payoutType}${reason ? ` · ${reason}` : ""})`;
  logActivity(userId, "profit", activityMessage);

  saveUserData(userId, data);

  const action = `Credited Profit: +$${amount.toFixed(2)} (${payoutType}) - Old=$${oldBalance.toFixed(2)}, New=$${data.practiceBalance.toFixed(2)} (Reason: ${reason})`;
  logAuditEvent(actor, action, data.profile.email);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("marketcapital_balance_updated", { detail: { userId, balance: data.practiceBalance } }));
  }

  return { newBalance: data.practiceBalance };
}

export function adjustBalanceWithAudit(userId: string, newBalance: number, reason: string, actor: string): number {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");

  const oldBalance = data.practiceBalance;
  const adjustment = newBalance - oldBalance;
  data.practiceBalance = newBalance;
  data.profile.practiceBalance = newBalance;

  const activityType = adjustment >= 0 ? "profit" : "account";
  const activityMessage = adjustment >= 0
    ? `Account credited: +$${adjustment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${reason})`
    : `Account debited: -$${Math.abs(adjustment).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${reason})`;
  logActivity(userId, activityType, activityMessage);

  saveUserData(userId, data);

  const action = `Balance Adjustment: Old=$${oldBalance.toFixed(2)}, New=$${newBalance.toFixed(2)}, Adj=$${adjustment >= 0 ? "+" : ""}$${adjustment.toFixed(2)} (Reason: ${reason})`;
  logAuditEvent(actor, action, data.profile.email);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("marketcapital_balance_updated", { detail: { userId, balance: data.practiceBalance } }));
  }

  return data.practiceBalance;
}

export function correctOrderWithAudit(userId: string, orderId: string, newPrice: number, newQty: number, reason: string, actor: string): void {
  const data = getUserData(userId);
  if (!data) throw new Error("User not found.");

  const targetOrder = data.paperOrders.find((o) => o.id === orderId);
  if (!targetOrder) throw new Error("Order not found.");

  const oldPrice = targetOrder.price;
  const oldQty = targetOrder.quantity;

  targetOrder.price = newPrice;
  targetOrder.quantity = newQty;
  saveUserData(userId, data);

  const action = `Order Correction (${targetOrder.symbol}): Price Old=$${oldPrice}, New=$${newPrice}; Qty Old=${oldQty}, New=${newQty} (Reason: ${reason})`;
  logAuditEvent(actor, action, `${data.profile.email} [Order #${orderId.slice(0, 8)}]`);
}

export function updateSupportTicketStatus(userId: string, ticketId: string, status: SupportTicket["status"], actor: string): void {
  const data = getUserData(userId);
  if (!data) return;
  data.supportTickets = data.supportTickets.map((t) => (t.id === ticketId ? { ...t, status } : t));
  saveUserData(userId, data);
  logAuditEvent(actor, `Marked ticket as ${status}`, data.supportTickets.find((t) => t.id === ticketId)?.subject ?? ticketId);
}

export function adminCancelOrder(userId: string, orderId: string, actor: string): void {
  const data = getUserData(userId);
  if (!data) return;
  data.paperOrders = data.paperOrders.map((o) => (o.id === orderId && o.status === "open" ? { ...o, status: "cancelled" as const } : o));
  saveUserData(userId, data);
  logAuditEvent(actor, "Cancelled open paper order", orderId);
}

export function getAuditLog(): AuditLogEntry[] {
  return readJSON<AuditLogEntry[]>(key("audit-log"), []);
}

export function logAuditEvent(actor: string, action: string, target: string): void {
  const log = getAuditLog();
  const entry: AuditLogEntry = { id: crypto.randomUUID(), actor, action, target, createdAt: new Date().toISOString() };
  writeJSON(key("audit-log"), [entry, ...log].slice(0, 100));
}
