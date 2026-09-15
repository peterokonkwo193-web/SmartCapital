import { NavLink } from "react-router-dom";
import { User } from "lucide-react";

import { MOBILE_TAB_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-border bg-surface-elevated/95 backdrop-blur lg:hidden"
      aria-label="Primary mobile"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {MOBILE_TAB_NAV.map(({ label, href, icon: Icon }) => (
        <NavLink
          key={href}
          to={href}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground",
              isActive && "text-primary",
            )
          }
        >
          <Icon className="size-5" />
          {label}
        </NavLink>
      ))}
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          cn(
            "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground",
            isActive && "text-primary",
          )
        }
      >
        <User className="size-5" />
        Profile
      </NavLink>
    </nav>
  );
}

export { BottomNav };
