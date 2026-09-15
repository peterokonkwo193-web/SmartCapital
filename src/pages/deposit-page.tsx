import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Upload, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { PaperTradingBanner } from "@/components/common/paper-trading-banner";
import { EmptyState } from "@/components/common/empty-state";
import { Spinner } from "@/components/common/spinner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeposits } from "@/hooks/use-deposits";
import { depositRequestSchema, type DepositRequestInput, type DepositRequestFormValues } from "@/lib/validation";
import { formatCurrency, formatDateTime } from "@/utils/format";
import type { DepositMethod, DepositStatus } from "@/types";

const METHOD_LABELS: Record<DepositMethod, string> = {
  bank_transfer: "Bank Transfer",
  card: "Card",
  crypto: "Crypto",
  other: "Other",
};

const STATUS_BADGE: Record<DepositStatus, { variant: "warning" | "success" | "destructive"; label: string; icon: typeof Clock }> = {
  pending: { variant: "warning", label: "Pending Review", icon: Clock },
  approved: { variant: "success", label: "Approved", icon: CheckCircle2 },
  rejected: { variant: "destructive", label: "Rejected", icon: XCircle },
};

function DepositPage() {
  const { requests, loading, submitDeposit } = useDeposits();

  useEffect(() => {
    document.title = "Deposits — SmartCapital";
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Deposits" description="Fund your live trading account and track deposit status." />
        <PaperTradingBanner />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <DepositForm onSubmit={submitDeposit} />
        <DepositHistory requests={requests} loading={loading} />
      </div>
    </div>
  );
}

function DepositForm({ onSubmit }: { onSubmit: ReturnType<typeof useDeposits>["submitDeposit"] }) {
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepositRequestFormValues, unknown, DepositRequestInput>({ resolver: zodResolver(depositRequestSchema) });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFileError("Please upload an image file.");
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
      setFileError("Please attach proof of payment.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ amount: values.amount, method: values.method, note: values.note, proofImage: proofFile });
      toast.success("Deposit request submitted", { description: "An admin will review and verify your deposit shortly." });
      reset({ amount: undefined, method: undefined, note: "" });
      setProofFile(null);
      setProofPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit deposit request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="size-4" /> Request a Deposit
        </CardTitle>
        <CardDescription>
          Submit your deposit details and proof of transfer. Your account balance will be credited upon confirmation.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="deposit-amount">Amount ($)</Label>
            <Input id="deposit-amount" type="number" step="0.01" min="0" className="font-mono" aria-invalid={Boolean(errors.amount)} {...register("amount")} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deposit-method">Payment Method</Label>
            <Controller
              name="method"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="deposit-method" className="w-full" aria-invalid={Boolean(errors.method)}>
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.method && <p className="text-xs text-destructive">{errors.method.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deposit-proof">Proof of Payment</Label>
            <input ref={fileInputRef} id="deposit-proof" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/30 px-4 py-6 text-center transition-colors hover:bg-muted/50"
            >
              {proofPreview ? (
                <img src={proofPreview} alt="Payment proof preview" className="max-h-32 rounded-md object-contain" />
              ) : (
                <>
                  <Upload className="size-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Click to upload a screenshot (max 5MB)</span>
                </>
              )}
            </button>
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deposit-note">Note (optional)</Label>
            <Textarea id="deposit-note" rows={2} placeholder="Reference number, notes for the admin…" {...register("note")} />
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Spinner className="size-4 text-current" />}
            Submit Deposit Request
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}

function DepositHistory({ requests, loading }: { requests: ReturnType<typeof useDeposits>["requests"]; loading: boolean }) {
  if (!loading && requests.length === 0) {
    return <EmptyState icon={Banknote} title="No deposit requests yet" description="Submitted deposit requests and their review status will appear here." />;
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const status = STATUS_BADGE[request.status];
        const StatusIcon = status.icon;
        return (
          <Card key={request.id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {request.proofImageUrl && (
                  <a href={request.proofImageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={request.proofImageUrl}
                      alt="Payment proof"
                      className="size-14 shrink-0 rounded-md border border-border object-cover"
                    />
                  </a>
                )}
                <div>
                  <p className="font-mono text-sm font-semibold text-foreground">{formatCurrency(request.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {METHOD_LABELS[request.method]} · {formatDateTime(request.createdAt)}
                  </p>
                  {request.status === "rejected" && request.adminNote && (
                    <p className="mt-1 text-xs text-destructive">Reason: {request.adminNote}</p>
                  )}
                </div>
              </div>
              <Badge variant={status.variant} className="w-fit">
                <StatusIcon className="mr-1 size-3" /> {status.label}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default DepositPage;
