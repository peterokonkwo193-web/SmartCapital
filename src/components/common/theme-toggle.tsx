import { Moon, Sun, Monitor } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

function ThemeToggle({ className, variant = "default" }: { className?: string; variant?: "default" | "sidebar" }) {
  const { theme, setTheme } = useTheme();
  const isSidebar = variant === "sidebar";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border p-0.5",
        isSidebar ? "border-sidebar-border bg-sidebar-accent/50" : "border-border bg-muted/50",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-label={`${label} theme`}
          aria-pressed={theme === value}
          className={cn(
            "flex size-8 items-center justify-center rounded-[5px] transition-colors",
            isSidebar
              ? theme === value
                ? "bg-sidebar-border text-sidebar-foreground"
                : "text-sidebar-muted hover:text-sidebar-foreground"
              : theme === value
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

export { ThemeToggle };
