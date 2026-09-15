import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-muted-foreground", className)} aria-hidden />;
}

function PageSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground" role="status">
      <Spinner className="size-6" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export { Spinner, PageSpinner };
