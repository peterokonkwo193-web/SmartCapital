import { cn } from "@/lib/utils";

function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      {/* Stylized 'F' in Accent Gold */}
      <path
        d="M7.5 8.5h8.5v2.4h-5.8v3.4h4.8v2.3h-4.8V23.5H7.5V8.5Z"
        className="fill-accent"
      />
      {/* Stylized 'X' in Clean Contrast */}
      <path
        d="M16.5 12h2.8l2.2 3.8 2.2-3.8h2.8l-3.6 5.7 3.8 5.8h-2.9l-2.3-3.8-2.3 3.8h-2.9l3.7-5.8-3.6-5.7Z"
        className="fill-primary-foreground"
      />
    </svg>
  );
}

function BrandLockup({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className={iconClassName} />
      <span className="font-sans text-[17px] font-bold tracking-tight text-foreground">
        FX<span className="text-primary font-extrabold">options</span>
      </span>
    </div>
  );
}

export { BrandMark, BrandLockup };
