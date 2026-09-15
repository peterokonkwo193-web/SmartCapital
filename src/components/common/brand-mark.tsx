import { cn } from "@/lib/utils";

function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M10 20.5c0 2.2 2.1 3.5 5 3.5 3.4 0 5.6-1.6 5.6-4.1 0-2.1-1.4-3.2-4.3-3.9l-1.8-.4c-1.3-.3-1.9-.7-1.9-1.5 0-1 1-1.6 2.5-1.6 1.6 0 2.7.7 2.9 1.9h2.7c-.2-2.5-2.2-4-5.5-4-3.1 0-5.3 1.6-5.3 4 0 2 1.3 3.1 4.1 3.8l1.8.4c1.5.4 2.1.8 2.1 1.6 0 1-1.1 1.7-2.7 1.7-1.8 0-3-.7-3.2-2h-2.8Z"
        className="fill-accent"
      />
    </svg>
  );
}

function BrandLockup({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className={iconClassName} />
      <span className="font-sans text-[17px] font-bold tracking-tight text-foreground">
        Smart<span className="text-primary">Capital</span>
      </span>
    </div>
  );
}

export { BrandMark, BrandLockup };
