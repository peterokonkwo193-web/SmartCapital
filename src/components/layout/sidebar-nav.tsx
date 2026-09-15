import { NavLink } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import { PRIMARY_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Primary">
      {user?.role === "admin" && (
        <NavLink
          to="/admin"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex h-11 items-center justify-between rounded-md px-3 text-sm font-semibold transition-colors mb-1.5 border border-primary/20 bg-primary/10 text-primary",
              "hover:bg-primary/20",
              isActive && "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
            )
          }
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-[18px] shrink-0" />
            <span>Admin Control Panel</span>
          </div>
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-inherit">
            Admin
          </span>
        </NavLink>
      )}

      {PRIMARY_NAV.map(({ label, href, icon: Icon }) => (
        <NavLink
          key={href}
          to={href}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-muted transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-foreground",
              isActive && "bg-sidebar-accent text-sidebar-foreground",
            )
          }
        >
          <Icon className="size-[18px] shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export { SidebarNav };
