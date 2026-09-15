import { NavLink } from "react-router-dom";

import { PRIMARY_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Primary">
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
