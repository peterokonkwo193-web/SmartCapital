import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/utils/format";

function TrendValue({ value, className, showIcon = true }: { value: number; className?: string; showIcon?: boolean }) {
  const isFlat = Math.abs(value) < 0.005;
  const isUp = value > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-sm font-medium",
        isFlat ? "text-muted-foreground" : isUp ? "text-success" : "text-destructive",
        className,
      )}
    >
      {showIcon && (isFlat ? <Minus className="size-3.5" /> : isUp ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />)}
      {formatPercent(value)}
    </span>
  );
}

export { TrendValue };
