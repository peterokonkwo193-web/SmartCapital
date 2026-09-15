import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { COUNTRIES } from "@/data/countries";

function CountrySelect({
  id,
  value,
  onValueChange,
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  value?: string;
  onValueChange: (value: string) => void;
  "aria-invalid"?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-invalid={ariaInvalid}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-surface px-3.5 text-sm text-foreground outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
            "aria-[invalid=true]:border-destructive",
          )}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>{value || "Select your country"}</span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries…"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">No country found.</p>
          )}
          {filtered.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onValueChange(c);
                setOpen(false);
                setQuery("");
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm text-foreground hover:bg-muted",
                value === c && "bg-muted",
              )}
            >
              <Check className={cn("size-3.5 shrink-0", value === c ? "opacity-100" : "opacity-0")} />
              {c}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { CountrySelect };
