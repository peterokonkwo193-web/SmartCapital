import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/** Live trading status banner — shows real-time market execution indicator. */
function PaperTradingBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full border border-success/30 bg-success/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-success",
        className,
      )}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      <span>LIVE TRADING</span>
      <span className="text-muted-foreground/60">·</span>
      <span className="text-muted-foreground">REAL MARKET EXECUTION</span>
    </div>
  );
}

/** Live execution indicator badge — shown on the order form and key UI elements. */
function SimulatedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-success",
        className,
      )}
    >
      <Zap className="size-2.5" />
      Live
    </span>
  );
}

export { PaperTradingBanner, SimulatedBadge };
