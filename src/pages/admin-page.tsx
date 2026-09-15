import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  ReceiptText,
  Wallet,
  LifeBuoy,
  ShieldCheck,
  Search,
  BookOpen,
  BarChart3,
  Edit2,
  DollarSign,
  FileText,
  Banknote,
  Check,
  X,
  Clock,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TrendValue } from "@/components/common/trend-value";
import { useAdminData } from "@/hooks/use-admin-data";
import { ASSETS, CATEGORY_LABELS } from "@/data/assets";
import { EDUCATION_ARTICLES } from "@/data/education";
import { formatCurrency, formatDate, formatDateTime, initials } from "@/utils/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AssetCategory, PaperOrder } from "@/types";
import { MessageSquare, Send } from "lucide-react";

interface AdminPageProps {
  initialTab?: string;
}

function AdminPage({ initialTab = "users" }: AdminPageProps) {
  const {
    users,
    orders,
    tickets,
    repliesByTicket,
    deposits,
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
  } = useAdminData();

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    document.title = "Admin — SmartCapital Enterprise";
  }, []);

  const stats = useMemo(() => {
    const activeUsers = users.filter((u) => !u.disabled).length;
    const totalBalance = users.reduce((sum, u) => sum + u.practiceBalance, 0);
    return {
      totalUsers: users.length,
      activeUsers,
      totalOrders: orders.length,
      totalBalance,
      openTickets: tickets.filter((t) => t.ticket.status !== "resolved" && t.ticket.status !== "closed").length,
      pendingDeposits: deposits.filter((d) => d.request.status === "pending").length,
    };
  }, [users, orders, tickets, deposits]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Enterprise Control Center" description="Administrative governance over users, client funds, order integrity, and support tickets." />
        <Badge variant="accent" className="mt-1 font-mono">
          <ShieldCheck className="mr-1 size-3.5" /> SECURE ADMIN RBAC
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard icon={Users} label="Total Registered Users" value={String(stats.totalUsers)} />
        <StatCard icon={UserCheck} label="Active Users" value={String(stats.activeUsers)} />
        <StatCard icon={ReceiptText} label="Live Trades" value={String(stats.totalOrders)} />
        <StatCard icon={Wallet} label="Total Liquidity" value={formatCurrency(stats.totalBalance, { compact: true })} />
        <StatCard icon={Banknote} label="Pending Deposits" value={String(stats.pendingDeposits)} sub="pending" />
        <StatCard icon={LifeBuoy} label="Active Support Tickets" value={String(stats.openTickets)} sub="open" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="deposits" className="relative">
            Deposits
            {stats.pendingDeposits > 0 && (
              <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-warning-foreground">
                {stats.pendingDeposits}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="trades">Live Trades</TabsTrigger>
          <TabsTrigger value="market-data">Market Data</TabsTrigger>
          <TabsTrigger value="education">Education CMS</TabsTrigger>
          <TabsTrigger value="support">Support Tickets</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab
            users={users}
            loading={loading}
            onSetEnabled={setUserEnabled}
            onSetRole={setUserRole}
            onAdjustBalance={adjustPracticeBalance}
            onCreditProfit={creditProfit}
          />
        </TabsContent>
        <TabsContent value="deposits">
          <DepositsTab deposits={deposits} loading={loading} onReview={reviewDeposit} />
        </TabsContent>
        <TabsContent value="trades">
          <TradesTab orders={orders} loading={loading} onCancel={cancelOrder} onCorrect={correctTrade} />
        </TabsContent>
        <TabsContent value="market-data">
          <MarketDataTab />
        </TabsContent>
        <TabsContent value="education">
          <EducationTab />
        </TabsContent>
        <TabsContent value="support">
          <SupportTab
            tickets={tickets}
            repliesByTicket={repliesByTicket}
            loading={loading}
            onUpdateStatus={updateTicketStatus}
            onReply={addTicketReply}
          />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTab entries={auditLog} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="space-y-2 py-5">
        <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </span>
        <div>
          <p className="font-mono text-lg font-semibold text-foreground">
            {value} {sub && <span className="text-xs font-normal text-muted-foreground">{sub}</span>}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function UsersTab({
  users,
  loading,
  onSetEnabled,
  onSetRole,
  onAdjustBalance,
  onCreditProfit,
}: {
  users: ReturnType<typeof useAdminData>["users"];
  loading: boolean;
  onSetEnabled: (userId: string, enabled: boolean) => Promise<void>;
  onSetRole: (userId: string, role: "user" | "admin") => Promise<void>;
  onAdjustBalance: (userId: string, newBalance: number, reason: string) => Promise<void>;
  onCreditProfit: (userId: string, amount: number, payoutType: string, reason: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<ReturnType<typeof useAdminData>["users"][number] | null>(null);
  const [dialogMode, setDialogMode] = useState<"profit" | "balance">("profit");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, query]);

  if (!loading && users.length === 0) {
    return <EmptyState icon={Users} title="No users found" description="Registered platform users will appear here." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Governance & Capital Management</CardTitle>
        <div className="relative pt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 mt-1 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users by name or email…" className="pl-9 sm:max-w-xs" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Profile</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Signed Up</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Account Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">{initials(u.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{u.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.country || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(u.memberSince)}</TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v) => onSetRole(u.id, v as "user" | "admin")}>
                      <SelectTrigger size="sm" className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="font-mono font-medium text-emerald-400">{formatCurrency(u.practiceBalance)}</TableCell>
                  <TableCell>
                    <Badge variant={u.disabled ? "destructive" : "success"}>{u.disabled ? "Disabled" : "Active"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={!u.disabled}
                      onCheckedChange={(checked) => {
                        onSetEnabled(u.id, checked);
                        toast.success(checked ? `${u.fullName} enabled` : `${u.fullName} disabled`);
                      }}
                      aria-label={`Toggle ${u.fullName} account status`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
                        onClick={() => {
                          setSelectedUser(u);
                          setDialogMode("profit");
                        }}
                      >
                        <TrendingUp className="mr-1 size-3.5" /> Give Profit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(u);
                          setDialogMode("balance");
                        }}
                      >
                        <DollarSign className="mr-1 size-3.5" /> Adjust
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {selectedUser && (
        <AdjustBalanceDialog
          user={selectedUser}
          initialMode={dialogMode}
          open={Boolean(selectedUser)}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          onConfirmBalance={onAdjustBalance}
          onConfirmProfit={onCreditProfit}
        />
      )}
    </Card>
  );
}

function AdjustBalanceDialog({
  user,
  initialMode,
  open,
  onOpenChange,
  onConfirmBalance,
  onConfirmProfit,
}: {
  user: ReturnType<typeof useAdminData>["users"][number];
  initialMode: "profit" | "balance";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmBalance: (userId: string, newBalance: number, reason: string) => Promise<void>;
  onConfirmProfit: (userId: string, amount: number, payoutType: string, reason: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<"profit" | "balance">(initialMode);
  const [profitAmount, setProfitAmount] = useState("500");
  const [payoutType, setPayoutType] = useState("Trading ROI Payout");
  const [profitReason, setProfitReason] = useState("Trading session profit distribution");

  const [newBalance, setNewBalance] = useState(String(user.practiceBalance));
  const [balanceReason, setBalanceReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setNewBalance(String(user.practiceBalance));
  }, [initialMode, user.practiceBalance]);

  const parsedProfit = parseFloat(profitAmount) || 0;
  const resultingProfitBalance = user.practiceBalance + Math.max(0, parsedProfit);

  async function handleProfitSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isNaN(parsedProfit) || parsedProfit <= 0) {
      toast.error("Please enter a valid positive profit amount.");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirmProfit(user.id, parsedProfit, payoutType, profitReason.trim() || "Trading profit payout");
      toast.success(`Credited +${formatCurrency(parsedProfit)} profit to ${user.fullName}`, {
        description: "Funds and live activity are now visible on the user's dashboard.",
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to credit profit.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBalanceSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(newBalance);
    if (isNaN(parsed) || parsed < 0) {
      toast.error("Please enter a valid positive balance.");
      return;
    }
    if (!balanceReason.trim()) {
      toast.error("A reason is mandatory for administrative balance adjustments.");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirmBalance(user.id, parsed, balanceReason.trim());
      toast.success(`Updated account balance for ${user.fullName}`, { description: "Audit trail record created." });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust balance.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "profit" ? <TrendingUp className="size-5 text-emerald-500" /> : <DollarSign className="size-5 text-accent" />}
            {mode === "profit" ? "Give Profit to User" : "Adjust Account Balance"}
          </DialogTitle>
          <DialogDescription>
            Managing funds for <strong>{user.fullName}</strong> ({user.email}). Any profit credited will immediately reflect on the user's dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex rounded-lg bg-muted p-1 text-xs">
          <button
            type="button"
            className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
              mode === "profit" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setMode("profit")}
          >
            📈 Give Profit / ROI (+)
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
              mode === "balance" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setMode("balance")}
          >
            ⚙️ Set Total Balance
          </button>
        </div>

        {mode === "profit" ? (
          <form onSubmit={handleProfitSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profit-amount">Profit Amount to Give ($)</Label>
              <Input
                id="profit-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={profitAmount}
                onChange={(e) => setProfitAmount(e.target.value)}
                className="font-mono text-lg font-semibold text-emerald-400"
                required
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[50, 100, 250, 500, 1000, 2500, 5000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setProfitAmount(String(val))}
                    className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    +${val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payout-type">Payout Category</Label>
              <Select value={payoutType} onValueChange={setPayoutType}>
                <SelectTrigger id="payout-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trading ROI Payout">Trading ROI Payout</SelectItem>
                  <SelectItem value="Weekly Strategy Yield">Weekly Strategy Yield</SelectItem>
                  <SelectItem value="Managed Account Profit">Managed Account Profit</SelectItem>
                  <SelectItem value="Performance Dividend">Performance Dividend</SelectItem>
                  <SelectItem value="Promotional Capital Credit">Promotional Capital Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profit-reason">Reason / Memo (Visible to Client)</Label>
              <Input
                id="profit-reason"
                placeholder="e.g. Daily market profit allocation, automated trading return…"
                value={profitReason}
                onChange={(e) => setProfitReason(e.target.value)}
              />
            </div>

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Current Client Balance:</span>
                <span className="font-mono text-foreground">{formatCurrency(user.practiceBalance)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Profit to be Credited:</span>
                <span className="font-mono">+{formatCurrency(parsedProfit)}</span>
              </div>
              <div className="border-t border-border/50 pt-1.5 flex justify-between font-medium">
                <span className="text-foreground">New Dashboard Balance:</span>
                <span className="font-mono text-emerald-300 text-sm">{formatCurrency(resultingProfitBalance)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || parsedProfit <= 0} className="bg-emerald-600 text-white hover:bg-emerald-500">
                <TrendingUp className="mr-1 size-3.5" /> Give +{formatCurrency(parsedProfit)} Profit
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleBalanceSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Account Balance</Label>
              <Input disabled value={formatCurrency(user.practiceBalance)} className="font-mono" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-balance">New Account Balance ($)</Label>
              <Input
                id="new-balance"
                type="number"
                step="0.01"
                min="0"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                className="font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adj-reason">Mandatory Audit Reason</Label>
              <Textarea
                id="adj-reason"
                placeholder="Provide explicit justification (e.g. System credit correction, Deposit adjustment request)…"
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                Save & Log Audit Event
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

const DEPOSIT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  card: "Card",
  crypto: "Crypto",
  other: "Other",
};

const DEPOSIT_METHOD_ICON: Record<string, string> = {
  bank_transfer: "🏦",
  card: "💳",
  crypto: "₿",
  other: "📄",
};

function DepositsTab({
  deposits,
  loading,
  onReview,
}: {
  deposits: ReturnType<typeof useAdminData>["deposits"];
  loading: boolean;
  onReview: (userId: string, requestId: string, approve: boolean, adminNote: string | undefined) => Promise<void>;
}) {
  const [galleryImage, setGalleryImage] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<ReturnType<typeof useAdminData>["deposits"][number] | null>(null);
  const [reviewApprove, setReviewApprove] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const pendingCount = deposits.filter((d) => d.request.status === "pending").length;
  const approvedCount = deposits.filter((d) => d.request.status === "approved").length;
  const rejectedCount = deposits.filter((d) => d.request.status === "rejected").length;

  const filtered = deposits.filter((d) => filterStatus === "all" || d.request.status === filterStatus);

  if (!loading && deposits.length === 0) {
    return (
      <EmptyState
        icon={Banknote}
        title="No deposit requests"
        description="When users submit deposit requests, they'll appear here for your review."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-center">
          <p className="font-mono text-2xl font-bold text-warning">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Awaiting Review</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-center">
          <p className="font-mono text-2xl font-bold text-success">{approvedCount}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center">
          <p className="font-mono text-2xl font-bold text-destructive">{rejectedCount}</p>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["pending", "all", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilterStatus(s)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filterStatus === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {s === "pending" ? `🕐 Pending${pendingCount > 0 ? ` (${pendingCount})` : ""}` : s === "all" ? "All" : s === "approved" ? `✓ Approved` : `✗ Rejected`}
          </button>
        ))}
      </div>

      {/* Deposit cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/10 py-12 text-center">
          <Banknote className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No {filterStatus !== "all" ? filterStatus : ""} deposits</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ userId, userName, userEmail, request }) => (
            <Card
              key={request.id}
              className={`transition-all ${request.status === "pending" ? "border-warning/40 bg-warning/5 hover:border-warning/60" : ""}`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: user + deposit info */}
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Proof image */}
                    <div className="shrink-0">
                      {request.proofImageUrl ? (
                        <button
                          type="button"
                          onClick={() => setGalleryImage(request.proofImageUrl)}
                          className="group relative block overflow-hidden rounded-lg border-2 border-border transition-all hover:border-primary"
                        >
                          <img
                            src={request.proofImageUrl}
                            alt="Payment proof"
                            className="size-16 object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <FileText className="size-5 text-white" />
                          </div>
                        </button>
                      ) : (
                        <div className="flex size-16 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 text-muted-foreground/40">
                          <FileText className="size-6" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{userName}</p>
                        <Badge variant={request.status === "approved" ? "success" : request.status === "rejected" ? "destructive" : "warning"}>
                          {request.status === "pending" && <Clock className="mr-1 size-3" />}
                          {request.status === "approved" && <Check className="mr-1 size-3" />}
                          {request.status === "rejected" && <X className="mr-1 size-3" />}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{userEmail}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {DEPOSIT_METHOD_ICON[request.method] ?? "📄"} {DEPOSIT_METHOD_LABELS[request.method] ?? request.method}
                        </span>
                        <span>·</span>
                        <span>Submitted {formatDateTime(request.createdAt)}</span>
                        {request.note && (
                          <>
                            <span>·</span>
                            <span className="italic">"{request.note}"</span>
                          </>
                        )}
                      </div>
                      {request.status !== "pending" && request.adminNote && (
                        <p className={`text-xs ${request.status === "rejected" ? "text-destructive" : "text-muted-foreground"}`}>
                          Admin note: {request.adminNote}
                        </p>
                      )}
                      {request.reviewedBy && (
                        <p className="text-xs text-muted-foreground/60">
                          Reviewed by {request.reviewedBy} · {request.reviewedAt ? formatDateTime(request.reviewedAt) : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: amount + actions */}
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <p className="font-mono text-2xl font-bold text-foreground">{formatCurrency(request.amount)}</p>
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-1 bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => {
                            setReviewApprove(true);
                            setReviewing({ userId, userName, userEmail, request });
                          }}
                        >
                          <Check className="size-3.5" /> Approve & Credit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            setReviewApprove(false);
                            setReviewing({ userId, userName, userEmail, request });
                          }}
                        >
                          <X className="size-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                    {request.status !== "pending" && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        {request.status === "approved" ? "Balance credited ✓" : "Request denied ✗"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Proof image lightbox */}
      <Dialog open={Boolean(galleryImage)} onOpenChange={(open) => !open && setGalleryImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Proof of Payment</DialogTitle>
            <DialogDescription>Click outside to close.</DialogDescription>
          </DialogHeader>
          {galleryImage && (
            <img src={galleryImage} alt="Payment proof full size" className="w-full rounded-lg object-contain max-h-[70vh]" />
          )}
        </DialogContent>
      </Dialog>

      {/* Review dialog */}
      {reviewing && (
        <DepositReviewDialog
          row={reviewing}
          approve={reviewApprove}
          open={Boolean(reviewing)}
          onOpenChange={(open) => !open && setReviewing(null)}
          onConfirm={onReview}
        />
      )}
    </div>
  );
}

function DepositReviewDialog({
  row,
  approve,
  open,
  onOpenChange,
  onConfirm,
}: {
  row: ReturnType<typeof useAdminData>["deposits"][number];
  approve: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userId: string, requestId: string, approve: boolean, adminNote: string | undefined) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!approve && !note.trim()) {
      toast.error("A reason is required when rejecting a deposit.");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(row.userId, row.request.id, approve, note.trim() || undefined);
      toast.success(approve ? `✓ Approved deposit for ${row.userName}` : `✗ Rejected deposit for ${row.userName}`, {
        description: approve
          ? `${formatCurrency(row.request.amount)} has been credited to their live account.`
          : "The user has been notified of the rejection reason.",
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to review deposit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approve ? (
                <span className="flex size-8 items-center justify-center rounded-full bg-success/20 text-success">
                  <Check className="size-4" />
                </span>
              ) : (
                <span className="flex size-8 items-center justify-center rounded-full bg-destructive/20 text-destructive">
                  <X className="size-4" />
                </span>
              )}
              {approve ? "Approve Payment" : "Reject Payment"}
            </DialogTitle>
            <DialogDescription>
              Reviewing deposit from <strong>{row.userName}</strong> ({row.userEmail})
            </DialogDescription>
          </DialogHeader>

          {/* Deposit summary */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Deposit Amount</span>
              <span className="font-mono text-xl font-bold text-foreground">{formatCurrency(row.request.amount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium">
                {DEPOSIT_METHOD_ICON[row.request.method] ?? "📄"} {DEPOSIT_METHOD_LABELS[row.request.method] ?? row.request.method}
              </span>
            </div>
            {row.request.note && (
              <div className="flex justify-between items-start text-sm gap-4">
                <span className="text-muted-foreground shrink-0">User Note</span>
                <span className="text-right italic text-foreground/80">"{row.request.note}"</span>
              </div>
            )}
            {row.request.proofImageUrl && (
              <div className="pt-1">
                <img
                  src={row.request.proofImageUrl}
                  alt="Payment proof"
                  className="w-full max-h-32 rounded-lg border border-border object-contain"
                />
              </div>
            )}
            {approve && (
              <div className="flex justify-between items-center text-sm font-semibold border-t border-border/50 pt-2 text-success">
                <span>Will be credited to account</span>
                <span className="font-mono">+{formatCurrency(row.request.amount)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit-review-note">{approve ? "Admin Note (optional)" : "Rejection Reason (required)"}</Label>
            <Textarea
              id="deposit-review-note"
              placeholder={approve ? "Optional note for your records…" : "Explain why this deposit is being rejected…"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              required={!approve}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={approve ? "default" : "destructive"}
              className={approve ? "bg-success text-success-foreground hover:bg-success/90" : ""}
              disabled={submitting}
            >
              {submitting ? "Processing…" : approve ? `Approve & Credit ${formatCurrency(row.request.amount)}` : "Reject Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TradesTab({
  orders,
  loading,
  onCancel,
  onCorrect,
}: {
  orders: ReturnType<typeof useAdminData>["orders"];
  loading: boolean;
  onCancel: (userId: string, orderId: string) => Promise<void>;
  onCorrect: (userId: string, orderId: string, newPrice: number, newQty: number, reason: string) => Promise<void>;
}) {
  const [editingOrder, setEditingOrder] = useState<PaperOrder | null>(null);
  const [editingUserId, setEditingUserId] = useState<string>("");

  if (!loading && orders.length === 0) {
    return <EmptyState icon={ReceiptText} title="No live trades" description="Live orders placed by users will appear here." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Trade Audit & Integrity Control</CardTitle>
        <CardDescription>
          Monitor all live order records. Modifications or cancellations require documented audit logging.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 100).map(({ userId, userName, order }) => (
                <TableRow key={order.id}>
                  <TableCell className="text-muted-foreground">{userName}</TableCell>
                  <TableCell className="font-medium">{order.symbol}</TableCell>
                  <TableCell className="capitalize font-semibold">{order.side}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{order.type}</TableCell>
                  <TableCell className="font-mono">{order.quantity}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(order.price)}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === "filled" ? "success" : order.status === "open" ? "warning" : "outline"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(order.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingOrder(order);
                          setEditingUserId(userId);
                        }}
                      >
                        <Edit2 className="mr-1 size-3" /> Correct
                      </Button>
                      {order.status === "open" && (
                        <Button variant="destructive" size="sm" onClick={() => onCancel(userId, order.id)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {editingOrder && (
        <TradeCorrectionDialog
          order={editingOrder}
          userId={editingUserId}
          open={Boolean(editingOrder)}
          onOpenChange={(open) => !open && setEditingOrder(null)}
          onConfirm={onCorrect}
        />
      )}
    </Card>
  );
}

function TradeCorrectionDialog({
  order,
  userId,
  open,
  onOpenChange,
  onConfirm,
}: {
  order: PaperOrder;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userId: string, orderId: string, newPrice: number, newQty: number, reason: string) => Promise<void>;
}) {
  const [price, setPrice] = useState(String(order.price));
  const [quantity, setQuantity] = useState(String(order.quantity));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(price);
    const q = parseFloat(quantity);
    if (isNaN(p) || p <= 0 || isNaN(q) || q <= 0) {
      toast.error("Please enter valid price and quantity values.");
      return;
    }
    if (!reason.trim()) {
      toast.error("A written reason is mandatory for trade integrity corrections.");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(userId, order.id, p, q, reason.trim());
      toast.success(`Corrected order #${order.id.slice(0, 8)}`, { description: "Audit trail entry logged." });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to correct order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Trade Integrity Correction</DialogTitle>
            <DialogDescription>
              Correct execution parameters for order <strong>#{order.id.slice(0, 8)}</strong> ({order.symbol}). Changes are recorded in audit logs.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Executed Price ($)</Label>
              <Input id="edit-price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="font-mono" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-qty">Executed Quantity</Label>
              <Input id="edit-qty" type="number" step="0.0001" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="font-mono" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trade-reason">Mandatory Written Reason</Label>
            <Textarea
              id="trade-reason"
              placeholder="Document the exact cause of correction (e.g. Market data misquote adjustment)…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              Apply & Log Audit Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MarketDataTab() {
  const categories = Object.keys(CATEGORY_LABELS) as AssetCategory[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {categories.map((cat) => (
          <Card key={cat}>
            <CardContent className="space-y-1 py-4">
              <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[cat]}</p>
              <p className="font-mono text-lg font-semibold">{ASSETS.filter((a) => a.category === cat).length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-4" /> Market Feed Management
          </CardTitle>
          <CardDescription>Live asset quotes streamed from real-time market feeds.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>24H</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ASSETS.map((asset) => (
                <TableRow key={asset.symbol}>
                  <TableCell className="font-medium">
                    {asset.name} <span className="text-muted-foreground">({asset.symbol})</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{CATEGORY_LABELS[asset.category]}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(asset.price)}</TableCell>
                  <TableCell>
                    <TrendValue value={asset.changePercent24h} showIcon={false} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function EducationTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-4" /> Education Content Management
        </CardTitle>
        <CardDescription>Curated educational articles and category guides published to users.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EDUCATION_ARTICLES.map((article) => (
              <TableRow key={article.slug}>
                <TableCell className="font-medium">{article.title}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">/education/{article.slug}</TableCell>
                <TableCell className="text-muted-foreground">
                  {article.types.length + article.benefits.length + article.risks.length} sections
                </TableCell>
                <TableCell>
                  <Badge variant="success">Published</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SupportTab({
  tickets,
  repliesByTicket,
  loading,
  onUpdateStatus,
  onReply,
}: {
  tickets: ReturnType<typeof useAdminData>["tickets"];
  repliesByTicket: ReturnType<typeof useAdminData>["repliesByTicket"];
  loading: boolean;
  onUpdateStatus: (userId: string, ticketId: string, status: "open" | "in_progress" | "resolved" | "closed") => Promise<void>;
  onReply: (userId: string, ticketId: string, message: string, isInternal: boolean) => Promise<void>;
}) {
  const [selected, setSelected] = useState<(typeof tickets)[number] | null>(null);

  if (!loading && tickets.length === 0) {
    return <EmptyState icon={LifeBuoy} title="No support tickets" description="User-submitted support tickets will appear here." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Desk Management</CardTitle>
        <CardDescription>Respond to tickets, add internal notes, and manage status: Open, In Progress, Resolved, Closed.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Replies</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((row) => {
                const { userId, userName, ticket } = row;
                const replyCount = repliesByTicket[ticket.id]?.length ?? 0;
                return (
                  <TableRow key={ticket.id}>
                    <TableCell className="text-muted-foreground">{userName}</TableCell>
                    <TableCell className="max-w-[220px] truncate font-medium">{ticket.subject}</TableCell>
                    <TableCell className="text-muted-foreground">{ticket.category}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(ticket.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{replyCount}</TableCell>
                    <TableCell>
                      <Select value={ticket.status} onValueChange={(v) => onUpdateStatus(userId, ticket.id, v as "open" | "in_progress" | "resolved" | "closed")}>
                        <SelectTrigger size="sm" className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelected(row)}>
                        <MessageSquare className="mr-1 size-3.5" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {selected && (
        <TicketDetailDialog
          row={selected}
          replies={repliesByTicket[selected.ticket.id] ?? []}
          open={Boolean(selected)}
          onOpenChange={(open) => !open && setSelected(null)}
          onReply={onReply}
        />
      )}
    </Card>
  );
}

function TicketDetailDialog({
  row,
  replies,
  open,
  onOpenChange,
  onReply,
}: {
  row: ReturnType<typeof useAdminData>["tickets"][number];
  replies: ReturnType<typeof useAdminData>["repliesByTicket"][string];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReply: (userId: string, ticketId: string, message: string, isInternal: boolean) => Promise<void>;
}) {
  const { userId, userName, ticket } = row;
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!message.trim()) {
      toast.error("Reply message cannot be empty.");
      return;
    }
    setSending(true);
    try {
      await onReply(userId, ticket.id, message.trim(), isInternal);
      setMessage("");
      setIsInternal(false);
      toast.success(isInternal ? "Internal note added" : "Reply sent to user", { description: "Audit trail record created." });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="max-w-[90%] truncate">{ticket.subject}</DialogTitle>
          <DialogDescription>
            {userName} · {ticket.category} · {formatDateTime(ticket.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto rounded-md border border-border bg-muted/30 p-3">
          <div className="rounded-md bg-surface p-3 text-sm">
            <p className="mb-1 text-xs font-medium text-muted-foreground">{userName} (ticket opener)</p>
            <p className="leading-relaxed text-foreground">{ticket.message}</p>
          </div>

          {replies.map((reply) => (
            <div
              key={reply.id}
              className={`rounded-md p-3 text-sm ${reply.isInternal ? "border border-dashed border-warning/50 bg-warning/10" : "bg-primary/10"}`}
            >
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {reply.authorName}
                {reply.isInternal && (
                  <Badge variant="outline" className="h-4 px-1 text-[10px]">
                    Internal note
                  </Badge>
                )}
                <span className="ml-auto font-normal">{formatDateTime(reply.createdAt)}</span>
              </p>
              <p className="leading-relaxed text-foreground">{reply.message}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <Textarea
            placeholder={isInternal ? "Add an internal note (not visible to the user)…" : "Write a reply to the user…"}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={isInternal} onCheckedChange={setIsInternal} id="internal-note-toggle" />
              <Label htmlFor="internal-note-toggle" className="text-xs font-normal text-muted-foreground">
                Internal note (staff only, not visible to user)
              </Label>
            </div>
            <Button size="sm" onClick={handleSend} disabled={sending}>
              <Send className="mr-1 size-3.5" /> {isInternal ? "Add Note" : "Send Reply"}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AuditTab({ entries, loading }: { entries: ReturnType<typeof useAdminData>["auditLog"]; loading: boolean }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.actor.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || e.target.toLowerCase().includes(q));
  }, [entries, search]);

  if (!loading && entries.length === 0) {
    return <EmptyState icon={ShieldCheck} title="No audit events recorded" description="Administrative actions will be logged here." />;
  }

  return (
    <Card>
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" /> Administrative Audit Trail
          </CardTitle>
          <CardDescription>Immutable record of account balance adjustments, order corrections, and role modifications.</CardDescription>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter audit logs…" className="pl-9 text-xs" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor (Admin)</TableHead>
                <TableHead>Action & Justification</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs font-semibold">{entry.actor}</TableCell>
                  <TableCell className="max-w-md text-sm">{entry.action}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{entry.target}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{formatDateTime(entry.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminPage;
