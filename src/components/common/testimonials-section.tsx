import { Quote, Star } from "lucide-react";

import { TESTIMONIALS } from "@/data/testimonials";
import { cn } from "@/lib/utils";

function TestimonialsSection({ variant = "page" }: { variant?: "page" | "embedded" }) {
  return (
    <section
      className={cn(
        variant === "page" && "border-t border-border bg-muted/20 px-6 py-16 sm:px-10",
        variant === "embedded" && "py-2",
      )}
    >
      <div className={cn(variant === "page" && "mx-auto max-w-6xl")}>
        <div className={cn("mb-8", variant === "page" ? "text-center" : "text-left")}>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">What people are saying</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Trusted by traders around the world
          </h2>
          <p className={cn("mt-2 text-sm text-muted-foreground", variant === "page" && "mx-auto max-w-xl")}>
            Real feedback from active traders using SmartCapital to build and execute high-performance portfolios.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="flex flex-col rounded-lg border border-border bg-surface p-5 shadow-sm">
              <Quote className="mb-3 size-5 text-accent/60" />
              <p className="flex-1 text-sm leading-relaxed text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                  {t.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.country}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3 fill-warning text-warning" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { TestimonialsSection };
