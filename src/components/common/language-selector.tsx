import { useState, useEffect, useMemo } from "react";
import { Globe, Check, Search, Languages, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import {
  SUPPORTED_LANGUAGES,
  getCurrentLanguage,
  setLanguage,
  type Language,
} from "@/lib/languages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  variant?: "sidebar" | "header" | "outline" | "ghost" | "profile";
  className?: string;
  showLabel?: boolean;
}

export function LanguageSelector({
  variant = "sidebar",
  className,
  showLabel = true,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentLang, setCurrentLang] = useState<Language>(getCurrentLanguage());

  useEffect(() => {
    const handleLangChange = () => {
      setCurrentLang(getCurrentLanguage());
    };
    window.addEventListener("fxoptions_language_changed", handleLangChange);
    window.addEventListener("marketcapital_language_changed", handleLangChange);
    return () => {
      window.removeEventListener("fxoptions_language_changed", handleLangChange);
      window.removeEventListener("marketcapital_language_changed", handleLangChange);
    };
  }, []);

  const filteredLanguages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [search]);

  const popularLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.filter((l) => l.popular);
  }, []);

  function handleSelectLanguage(lang: Language) {
    if (lang.code === currentLang.code) {
      setOpen(false);
      return;
    }
    toast.success(`Switching language to ${lang.nativeName} (${lang.name})...`);
    setOpen(false);
    // Slight timeout so modal closing animation finishes cleanly before reload
    setTimeout(() => {
      setLanguage(lang.code);
    }, 200);
  }

  return (
    <>
      {/* Trigger Buttons by Variant */}
      {variant === "sidebar" && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-sidebar-border bg-sidebar-accent/50 px-2.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-white",
            className
          )}
          title="Change Platform Language"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="size-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              {currentLang.flag} {currentLang.nativeName}
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase text-sidebar-muted shrink-0">
            {currentLang.code}
          </span>
        </button>
      )}

      {variant === "header" && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className={cn(
            "h-8 gap-1.5 px-2 text-xs font-semibold text-foreground hover:bg-muted/70",
            className
          )}
          title="Change Language"
        >
          <span className="text-sm">{currentLang.flag}</span>
          <span className="font-mono text-xs uppercase">{currentLang.code}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      )}

      {variant === "outline" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className={cn("h-8 gap-1.5 px-2.5 text-xs font-medium", className)}
          title="Change Platform Language"
        >
          <Globe className="size-3.5 text-emerald-500" />
          <span>
            {currentLang.flag} {currentLang.nativeName}
          </span>
          <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
        </Button>
      )}

      {variant === "profile" && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className={cn(
            "flex h-10 w-full sm:w-auto items-center justify-between gap-3 px-3.5 text-xs font-medium border-border hover:bg-muted/60",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-emerald-500" />
            <span className="font-medium text-foreground">
              {currentLang.flag} {currentLang.nativeName} ({currentLang.name})
            </span>
          </div>
          <Badge variant="secondary" className="font-mono text-[10px] uppercase">
            {currentLang.code}
          </Badge>
        </Button>
      )}

      {variant === "ghost" && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
            className
          )}
        >
          <Globe className="size-3.5 text-emerald-500" />
          {showLabel && (
            <span>
              {currentLang.flag} {currentLang.nativeName}
            </span>
          )}
        </button>
      )}

      {/* Language Selection Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                <Languages className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  Select Language / भाषा / 语言 / Idioma
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Choose your preferred language for trading, market data, and account governance.
                </DialogDescription>
              </div>
            </div>

            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search across 30+ world languages (e.g. Spanish, French, 中文, العربية)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
                autoFocus
              />
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Quick Popular Picks (shown when not searching) */}
            {!search && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Popular World Languages
                  </span>
                  <Badge variant="outline" className="text-[10px] h-4 text-emerald-400 border-emerald-500/30">
                    Instant Global Translation
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {popularLanguages.map((lang) => {
                    const isSelected = lang.code.toLowerCase() === currentLang.code.toLowerCase();
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectLanguage(lang)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border p-2.5 text-left transition-all",
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm"
                            : "border-border bg-card/60 hover:bg-muted/60 text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{lang.flag}</span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">{lang.nativeName}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{lang.name}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="size-4 shrink-0 text-emerald-400 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Languages List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {search ? `Search Results (${filteredLanguages.length})` : "All Languages"}
              </span>

              {filteredLanguages.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-muted-foreground">No languages match "{search}".</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredLanguages.map((lang) => {
                    const isSelected = lang.code.toLowerCase() === currentLang.code.toLowerCase();
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectLanguage(lang)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border p-2.5 text-left transition-all",
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm"
                            : "border-border bg-card/60 hover:bg-muted/60 text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0">{lang.flag}</span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">{lang.nativeName}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{lang.name}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="size-4 shrink-0 text-emerald-400 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border bg-muted/20 px-6 py-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Translations are applied seamlessly across all platform markets and dashboards.</span>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-7 text-xs">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

