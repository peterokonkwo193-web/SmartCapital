import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/common/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ASSETS, getAssetBySymbol } from "@/data/assets";
import { useLiveMarket } from "@/hooks/use-live-market";
import { usePaperTrading } from "@/hooks/use-paper-trading";
import { paperOrderSchema, type PaperOrderInput, type PaperOrderFormValues } from "@/lib/validation";
import { formatCurrency } from "@/utils/format";

function PaperOrderForm({ defaultSymbol, onSuccess }: { defaultSymbol?: string; onSuccess?: () => void }) {
  const { placeOrder, balance } = usePaperTrading();
  const { getLiveAsset, assets: liveAssets } = useLiveMarket();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaperOrderFormValues, unknown, PaperOrderInput>({
    resolver: zodResolver(paperOrderSchema),
    defaultValues: { symbol: defaultSymbol ?? ASSETS[0].symbol, side: "buy", type: "market", quantity: 1 },
  });

  const symbol = watch("symbol");
  const type = watch("type");
  const quantity = watch("quantity");
  const asset = useMemo(() => getLiveAsset(symbol) ?? getAssetBySymbol(symbol), [symbol, getLiveAsset]);
  const estimatedCost = asset ? asset.price * (Number(quantity) || 0) : 0;

  async function onSubmit(values: PaperOrderInput) {
    setSubmitError(null);
    const executionAsset = getLiveAsset(values.symbol) ?? getAssetBySymbol(values.symbol);
    if (!executionAsset) {
      setSubmitError("Select a valid asset.");
      return;
    }
    try {
      await placeOrder({
        symbol: values.symbol,
        side: values.side,
        type: values.type,
        quantity: values.quantity,
        price: values.type === "market" ? executionAsset.price : values.limitPrice ?? executionAsset.price,
      });
      toast.success(`Order executed at live price — ${values.side.toUpperCase()} ${values.quantity} ${values.symbol} @ ${formatCurrency(executionAsset.price)}`, {
        description: "Filled using real-time market execution quote.",
      });
      onSuccess?.();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to place order.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Controller
        control={control}
        name="side"
        render={({ field }) => (
          <Tabs value={field.value} onValueChange={field.onChange}>
            <TabsList className="w-full">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      />

      <div className="space-y-1.5">
        <Label htmlFor="order-symbol">Asset</Label>
        <Controller
          control={control}
          name="symbol"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="order-symbol" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {liveAssets.map((a) => (
                  <SelectItem key={a.symbol} value={a.symbol}>
                    {a.name} ({a.symbol}) — {formatCurrency(a.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {asset && (
          <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/40 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Live Execution Price</span>
            <span className="font-mono font-semibold text-foreground flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-success animate-pulse" />
              {formatCurrency(asset.price)}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="order-type">Order Type</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="order-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                  <SelectItem value="stop">Stop</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="order-quantity">Quantity</Label>
          <Input id="order-quantity" type="number" step="any" min="0" aria-invalid={Boolean(errors.quantity)} {...register("quantity")} />
        </div>
      </div>

      {type !== "market" && (
        <div className="space-y-1.5">
          <Label htmlFor="order-limit-price">{type === "limit" ? "Limit Price" : "Stop Price"}</Label>
          <Input id="order-limit-price" type="number" step="any" min="0" {...register("limitPrice")} />
        </div>
      )}

      {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}

      <div className="rounded-md border border-border bg-muted/40 px-3.5 py-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Market Price</span>
          <span className="font-mono">{asset ? formatCurrency(asset.price) : "—"}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-muted-foreground">Estimated {type === "market" ? "Cost" : "Value"}</span>
          <span className="font-mono font-semibold">{formatCurrency(estimatedCost)}</span>
        </div>
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Available Balance</span>
          <span className="font-mono text-muted-foreground">{formatCurrency(balance)}</span>
        </div>
      </div>

      {submitError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{submitError}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Spinner className="size-4 text-current" />}
        Place Order
      </Button>
      <p className="text-center text-xs text-muted-foreground">Instant execution with live market pricing.</p>
    </form>
  );
}

export { PaperOrderForm };
