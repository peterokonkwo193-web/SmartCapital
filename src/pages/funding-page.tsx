import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  History,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Upload,
  Wallet,
  XCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Spinner } from "@/components/common/spinner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useDeposits } from "@/hooks/use-deposits";
import { useWithdrawals } from "@/hooks/use-withdrawals";
import { useFundingHistory } from "@/hooks/use-funding-history";
import {
  depositRequestSchema,
  withdrawalRequestSchema,
  type DepositRequestInput,
  type DepositRequestFormValues,
  type WithdrawalRequestInput,
  type WithdrawalRequestFormValues,
} from "@/lib/validation";
import { formatCurrency, formatDateTime } from "@/utils/format";
import type { DepositMethod, WithdrawalMethod } from "@/types";

const DEPOSIT_METHOD_LABELS: Record<DepositMethod, string> = {
  bank_transfer: "Bank Transfer",
  card: "Credit / Debit Card",
  crypto: "Crypto (USDT / BTC)",
  other: "Wire Transfer / Other",
};

const WITHDRAWAL_METHOD_LABELS: Record<WithdrawalMethod, string> = {
  crypto: "Crypto (USDT / BTC)",
  bank_wire: "Bank Wire Transfer",
  paypal: "PayPal",
  other: "Other Electronic Transfer",
};

const STATUS_CONFIG: Record<string, { variant: "warning" | "success" | "destructive" | "secondary"; label: string; icon: typeof Clock }> = {
  pending: { variant: "warning", label: "Pending Review", icon: Clock },
  approved: { variant: "success", label: "Approved & Completed", icon: CheckCircle2 },
  completed: { variant: "success", label: "Completed", icon: CheckCircle2 },
  rejected: { variant: "destructive", label: "Rejected", icon: XCircle },
};

export default function FundingPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const { requests: deposits, loading: depositsLoading, submitDeposit } = useDeposits();
  const { requests: withdrawals, loading: withdrawalsLoading, submitWithdrawal } = useWithdrawals();
  const { transactions, loading: historyLoading } = useFundingHistory();

  useEffect(() => {
    document.title = "Transactions & Funding — SmartCapital";
  }, []);

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  const balanceStats = useMemo(() => {
    const totalDeposited = deposits
      .filter((d) => d.status === "approved")
      .reduce((acc, d) => acc + d.amount, 0);

    const pendingDeposits = deposits
      .filter((d) => d.status === "pending")
      .reduce((acc, d) => acc + d.amount, 0);

    const totalWithdrawn = withdrawals
      .filter((w) => w.status === "approved")
      .reduce((acc, w) => acc + w.amount, 0);

    const pendingWithdrawals = withdrawals
      .filter((w) => w.status === "pending")
      .reduce((acc, w) => acc + w.amount, 0);

    const totalProfits = transactions
      .filter((t) => t.type === "profit")
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      availableBalance: user?.practiceBalance ?? 0,
      totalDeposited,
      pendingDeposits,
      totalWithdrawn,
      pendingWithdrawals,
      totalProfits,
    };
  }, [user, deposits, withdrawals, transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Funding & Transactions"
          description="Manage deposits, request withdrawals, and track your complete account financial history."
        />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 px-3 py-1 font-mono text-xs text-primary">
            <ShieldCheck className="mr-1.5 size-3.5" /> SECURE FINANCIAL ESCROW
          </Badge>
        </div>
      </div>

      {/* Balance Summary Header Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Trading Balance</span>
              <Wallet className="size-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {formatCurrency(balanceStats.availableBalance)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Available for trades & withdrawals</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Deposits</span>
              <ArrowDownToLine className="size-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {formatCurrency(balanceStats.totalDeposited)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {balanceStats.pendingDeposits > 0 ? (
                <span className="text-amber-500 font-medium">+{formatCurrency(balanceStats.pendingDeposits)} pending review</span>
              ) : (
                "Settled to balance"
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Withdrawals</span>
              <ArrowUpFromLine className="size-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {formatCurrency(balanceStats.totalWithdrawn)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {balanceStats.pendingWithdrawals > 0 ? (
                <span className="text-amber-500 font-medium">{formatCurrency(balanceStats.pendingWithdrawals)} in review</span>
              ) : (
                "Processed payouts"
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Profits Credited</span>
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {formatCurrency(balanceStats.totalProfits)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">ROI, Trade Profits & Bonuses</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Wallet className="size-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="deposit" className="flex items-center gap-2">
            <ArrowDownToLine className="size-4" /> Deposit
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="flex items-center gap-2">
            <ArrowUpFromLine className="size-4" /> Withdraw
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="size-4" /> History
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <DollarSign className="size-5 text-muted-foreground" />
                </div>
                <CardDescription>Instant access to account capital funding operations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleTabChange("deposit")}
                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <ArrowDownToLine className="size-4" /> Deposit Funds
                  </Button>
                  <Button
                    onClick={() => handleTabChange("withdraw")}
                    variant="outline"
                    className="flex-1 gap-2 border-primary/40 hover:bg-primary/5"
                  >
                    <ArrowUpFromLine className="size-4" /> Request Withdrawal
                  </Button>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3.5 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <ShieldCheck className="size-4 text-emerald-500" /> Real-time Execution & Escrow Protection
                  </div>
                  <p>
                    All deposits are processed through automated blockchain verification or institutional wire reconciliation.
                    Withdrawals are reviewed and disbursed within 15–60 minutes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => handleTabChange("history")} className="text-xs">
                    View All
                  </Button>
                </div>
                <CardDescription>Latest funding, withdrawal, and profit events.</CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="py-8 flex justify-center"><Spinner /></div>
                ) : transactions.length === 0 ? (
                  <EmptyState title="No transactions yet" description="Your deposits, withdrawals, and profits will appear here." />
                ) : (
                  <div className="divide-y divide-border/60">
                    {transactions.slice(0, 4).map((t) => (
                      <div key={t.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              t.type === "deposit"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : t.type === "withdrawal"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {t.type === "deposit" ? (
                              <ArrowDownToLine className="size-4" />
                            ) : t.type === "withdrawal" ? (
                              <ArrowUpFromLine className="size-4" />
                            ) : (
                              <TrendingUp className="size-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-foreground">{t.title}</div>
                            <div className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold text-sm ${
                              t.type === "withdrawal" ? "text-amber-500" : "text-emerald-500"
                            }`}
                          >
                            {t.type === "withdrawal" ? "-" : "+"}
                            {formatCurrency(t.amount)}
                          </div>
                          <Badge
                            variant={
                              t.status === "completed"
                                ? "success"
                                : t.status === "pending"
                                ? "warning"
                                : "destructive"
                            }
                            className="text-[10px] px-1.5 py-0 h-4 uppercase"
                          >
                            {t.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DEPOSIT TAB */}
        <TabsContent value="deposit" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <DepositForm onSubmit={submitDeposit} />
            <DepositHistory requests={deposits} loading={depositsLoading} />
          </div>
        </TabsContent>

        {/* WITHDRAWAL TAB */}
        <TabsContent value="withdraw" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <WithdrawalForm
              onSubmit={submitWithdrawal}
              availableBalance={user?.practiceBalance ?? 0}
            />
            <WithdrawalHistory requests={withdrawals} loading={withdrawalsLoading} />
          </div>
        </TabsContent>

        {/* UNIFIED TRANSACTION HISTORY TAB */}
        <TabsContent value="history" className="space-y-6">
          <TransactionHistoryTable transactions={transactions} loading={historyLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ----------------------------------------------------------------------
// DEPOSIT FORM & WALLET DETAILS
// ----------------------------------------------------------------------
function DepositForm({ onSubmit }: { onSubmit: ReturnType<typeof useDeposits>["submitDeposit"] }) {
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<DepositRequestFormValues, unknown, DepositRequestInput>({
    resolver: zodResolver(depositRequestSchema),
    defaultValues: { method: "crypto" },
  });

  const selectedMethod = watch("method") || "crypto";

  const cryptoAddresses = {
    usdt_trc20: "TX9zP34GkLtG6Z7mQw2yR8vW5x1s9b4E",
    btc: "bc1q9d8r7s6t5u4v3w2x1y0z8a7b6c5d4e3f2g1h0",
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopied(null), 2500);
  };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFileError("Please upload an image file (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError("Image must be smaller than 5MB.");
      return;
    }
    setFileError(null);
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  async function onFormSubmit(values: DepositRequestInput) {
    if (!proofFile) {
      setFileError("Please attach proof of payment (screenshot or receipt).");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ amount: values.amount, method: values.method, note: values.note, proofImage: proofFile });
      toast.success("Deposit request submitted!", {
        description: "Your payment proof has been forwarded to administration for verification.",
      });
      reset({ amount: undefined, method: "crypto", note: "" });
      setProofFile(null);
      setProofPreview(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit deposit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">Submit Deposit</CardTitle>
        <CardDescription>Select payment channel, send funds, and upload confirmation.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Payment instructions preview */}
        {selectedMethod === "crypto" && (
          <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-2.5 text-xs">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <QrCode className="size-4 text-primary" /> USDT (TRC-20) Official Address
            </div>
            <div className="flex items-center gap-2 rounded bg-background/80 p-2 border border-border/80 font-mono text-[11px] select-all">
              <span className="truncate flex-1">{cryptoAddresses.usdt_trc20}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={() => copyToClipboard(cryptoAddresses.usdt_trc20, "USDT Address")}
              >
                {copied === "USDT Address" ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </Button>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Send only USDT via Tron (TRC-20) network. Funds are automatically credited once verified.
            </div>
          </div>
        )}

        {selectedMethod === "bank_transfer" && (
          <div className="mb-5 rounded-lg border border-border/80 bg-muted/40 p-3.5 space-y-2 text-xs">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Banknote className="size-4 text-primary" /> Institutional Bank Wire Details
            </div>
            <div className="space-y-1 text-muted-foreground">
              <div><span className="font-medium text-foreground">Bank Name:</span> SmartCapital Global Trust</div>
              <div><span className="font-medium text-foreground">Account Name:</span> Market Capital Client Escrow</div>
              <div><span className="font-medium text-foreground">Account / IBAN:</span> US89 3100 0214 5590 1204 88</div>
              <div><span className="font-medium text-foreground">SWIFT / BIC:</span> SCAPUS33XXX</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="method">Payment Method</Label>
            <Controller
              name="method"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">Crypto (USDT TRC20 / BTC)</SelectItem>
                    <SelectItem value="bank_transfer">Bank Wire / Transfer</SelectItem>
                    <SelectItem value="card">Credit / Debit Card</SelectItem>
                    <SelectItem value="other">Other Transfer Method</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.method && <p className="text-xs text-destructive">{errors.method.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Deposit Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="10"
                placeholder="1,000.00"
                className="pl-7"
                {...register("amount", { valueAsNumber: true })}
              />
            </div>
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Transaction Reference / Hash (Optional)</Label>
            <Textarea
              id="note"
              rows={2}
              placeholder="e.g. TXID or wire transaction memo"
              {...register("note")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Proof of Payment</Label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            {proofPreview ? (
              <div className="relative overflow-hidden rounded-md border border-border">
                <img src={proofPreview} alt="Proof preview" className="max-h-40 w-full object-cover" />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 right-2 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Image
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-md border border-dashed border-border py-6 text-center transition-colors hover:border-primary hover:bg-muted/30"
              >
                <Upload className="mb-2 size-6 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Upload Screenshot or Receipt</span>
                <span className="text-[11px] text-muted-foreground">PNG, JPG, WebP up to 5MB</span>
              </button>
            )}
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Spinner className="mr-2 size-4" /> Submitting...
              </>
            ) : (
              "Submit Deposit Request"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DepositHistory({ requests, loading }: { requests: ReturnType<typeof useDeposits>["requests"]; loading: boolean }) {
  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="flex items-center justify-center py-16">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">Deposit Requests</CardTitle>
        <CardDescription>Track status and administrative approvals of your deposit requests.</CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No deposit requests"
            description="You have not submitted any deposits yet. Submit one using the form on the left."
          />
        ) : (
          <div className="divide-y divide-border/60">
            {requests.map((req) => {
              const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;

              return (
                <div key={req.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="font-semibold text-foreground text-base">
                        {formatCurrency(req.amount)}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          via {DEPOSIT_METHOD_LABELS[req.method]}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(req.createdAt)}</div>
                    </div>
                    <Badge variant={statusCfg.variant} className="self-start sm:self-auto gap-1 text-xs">
                      <StatusIcon className="size-3" /> {statusCfg.label}
                    </Badge>
                  </div>

                  {req.note && <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">Note: {req.note}</div>}

                  {req.adminNote && (
                    <div className="text-xs rounded bg-muted/60 p-2 text-foreground border-l-2 border-primary">
                      <span className="font-medium text-primary">Admin Feedback:</span> {req.adminNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------
// WITHDRAWAL FORM & WITHDRAWAL HISTORY
// ----------------------------------------------------------------------
function WithdrawalForm({
  onSubmit,
  availableBalance,
}: {
  onSubmit: ReturnType<typeof useWithdrawals>["submitWithdrawal"];
  availableBalance: number;
}) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<WithdrawalRequestFormValues, unknown, WithdrawalRequestInput>({
    resolver: zodResolver(withdrawalRequestSchema),
    defaultValues: { method: "crypto" },
  });

  const selectedMethod = watch("method") || "crypto";

  const destinationPlaceholder = useMemo(() => {
    switch (selectedMethod) {
      case "crypto":
        return "Enter your USDT (TRC-20 / ERC-20) or BTC wallet address";
      case "bank_wire":
        return "Bank Name, Account Holder Name, IBAN / Account #, SWIFT Code";
      case "paypal":
        return "Your PayPal registered email address";
      default:
        return "Account or transfer destination details";
    }
  }, [selectedMethod]);

  async function onFormSubmit(values: WithdrawalRequestInput) {
    if (values.amount > availableBalance) {
      toast.error(`Insufficient balance. You have $${availableBalance.toFixed(2)} available.`);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        amount: values.amount,
        method: values.method,
        destinationDetails: values.destinationDetails,
        note: values.note,
      });
      toast.success("Withdrawal request submitted!", {
        description: "Your withdrawal will be processed by administration within 15–60 minutes.",
      });
      reset({ amount: undefined, method: "crypto", destinationDetails: "", note: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit withdrawal request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">Request Withdrawal</CardTitle>
        <CardDescription>Disburse trading profits or capital directly to your personal wallet or bank.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Available for Withdrawal:</span>
            <span className="font-bold text-foreground text-sm">{formatCurrency(availableBalance)}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Zero withdrawal fees. Payouts processed directly upon administrative confirmation.
          </div>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="w-method">Payout Destination Method</Label>
            <Controller
              name="method"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="w-method">
                    <SelectValue placeholder="Select withdrawal channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">Crypto Wallet (USDT / BTC)</SelectItem>
                    <SelectItem value="bank_wire">Bank Wire Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal Electronic Transfer</SelectItem>
                    <SelectItem value="other">Other Payment Channel</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.method && <p className="text-xs text-destructive">{errors.method.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="w-amount">Withdrawal Amount (USD)</Label>
              <button
                type="button"
                onClick={() => setValue("amount", availableBalance, { shouldValidate: true })}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Max ({formatCurrency(availableBalance)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="w-amount"
                type="number"
                step="0.01"
                min="10"
                max={availableBalance}
                placeholder="500.00"
                className="pl-7"
                {...register("amount", { valueAsNumber: true })}
              />
            </div>
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="destinationDetails">Receiving Account / Wallet Details</Label>
            <Textarea
              id="destinationDetails"
              rows={3}
              placeholder={destinationPlaceholder}
              {...register("destinationDetails")}
            />
            {errors.destinationDetails && <p className="text-xs text-destructive">{errors.destinationDetails.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="w-note">Memo / Note (Optional)</Label>
            <Input id="w-note" placeholder="Optional notes for administration" {...register("note")} />
          </div>

          <Button type="submit" disabled={submitting || availableBalance <= 0} className="w-full">
            {submitting ? (
              <>
                <Spinner className="mr-2 size-4" /> Processing...
              </>
            ) : availableBalance <= 0 ? (
              "Insufficient Balance"
            ) : (
              "Confirm & Request Withdrawal"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function WithdrawalHistory({ requests, loading }: { requests: ReturnType<typeof useWithdrawals>["requests"]; loading: boolean }) {
  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="flex items-center justify-center py-16">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">Withdrawal Requests</CardTitle>
        <CardDescription>Track status and processing of your withdrawal disbursements.</CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <EmptyState
            icon={ArrowUpFromLine}
            title="No withdrawal requests"
            description="You have not requested any withdrawals yet. When you request a payout, it will appear here."
          />
        ) : (
          <div className="divide-y divide-border/60">
            {requests.map((req) => {
              const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;

              return (
                <div key={req.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="font-semibold text-foreground text-base">
                        {formatCurrency(req.amount)}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          via {WITHDRAWAL_METHOD_LABELS[req.method]}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(req.createdAt)}</div>
                    </div>
                    <Badge variant={statusCfg.variant} className="self-start sm:self-auto gap-1 text-xs">
                      <StatusIcon className="size-3" /> {statusCfg.label}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded space-y-1">
                    <div><span className="font-medium text-foreground">Destination:</span> {req.destinationDetails}</div>
                    {req.note && <div><span className="font-medium text-foreground">Memo:</span> {req.note}</div>}
                  </div>

                  {req.adminNote && (
                    <div className="text-xs rounded bg-muted/60 p-2 text-foreground border-l-2 border-primary">
                      <span className="font-medium text-primary">Admin Feedback:</span> {req.adminNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------
// FULL UNIFIED TRANSACTION HISTORY TABLE
// ----------------------------------------------------------------------
function TransactionHistoryTable({
  transactions,
  loading,
}: {
  transactions: ReturnType<typeof useFundingHistory>["transactions"];
  loading: boolean;
}) {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q) ?? false;
        const matchMethod = t.method?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchDesc && !matchMethod) return false;
      }
      return true;
    });
  }, [transactions, filterType, searchTerm]);

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Account Transaction History</CardTitle>
            <CardDescription>Comprehensive audit log of all deposits, withdrawals, and profit payouts.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="profit">Profits & ROI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-16 flex justify-center"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="No transactions found"
            description={searchTerm ? "No records match your search filter." : "You have no transactions recorded in this view."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/80 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4">Type & Details</th>
                  <th className="pb-3 px-4">Channel / Destination</th>
                  <th className="pb-3 px-4">Date</th>
                  <th className="pb-3 px-4 text-right">Amount</th>
                  <th className="pb-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-md ${
                            tx.type === "deposit"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : tx.type === "withdrawal"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {tx.type === "deposit" ? (
                            <ArrowDownToLine className="size-3.5" />
                          ) : tx.type === "withdrawal" ? (
                            <ArrowUpFromLine className="size-3.5" />
                          ) : (
                            <TrendingUp className="size-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{tx.title}</div>
                          {tx.description && (
                            <div className="text-xs text-muted-foreground max-w-xs truncate">{tx.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground capitalize">
                      {tx.method ? tx.method.replace("_", " ") : "Platform"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          tx.type === "withdrawal" ? "text-amber-500" : "text-emerald-500"
                        }`}
                      >
                        {tx.type === "withdrawal" ? "-" : "+"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <Badge
                        variant={
                          tx.status === "completed"
                            ? "success"
                            : tx.status === "pending"
                            ? "warning"
                            : "destructive"
                        }
                        className="text-[10px] px-2 py-0.5 uppercase"
                      >
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
