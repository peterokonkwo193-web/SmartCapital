import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, LogOut, User as UserIcon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { BrandLockup } from "@/components/common/brand-mark";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { initials } from "@/utils/format";

function MobileHeader() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    setOpen(false);
    toast.success("Signed out");
    navigate("/auth");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
      <BrandLockup iconClassName="size-7" />

      <div className="flex items-center gap-1.5">
        <Sheet open={open} onOpenChange={setOpen}>
          <Button variant="ghost" size="icon" className="size-10" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
          <SheetContent side="left" className="w-[280px] bg-sidebar p-0 text-sidebar-foreground border-sidebar-border">
            <SheetHeader className="px-5 pt-5">
              <SheetTitle asChild>
                <BrandLockup className="[&_span]:text-sidebar-foreground [&_span_span]:text-sidebar-primary" />
              </SheetTitle>
            </SheetHeader>

            {user && (
              <div className="flex items-center gap-2.5 px-5 pt-3">
                <Avatar className="size-9 border border-sidebar-border">
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">{initials(user.fullName)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{user.fullName}</span>
                  <span className="block truncate text-xs text-sidebar-muted">{user.email}</span>
                </span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <SidebarNav onNavigate={() => setOpen(false)} />
            </div>

            <div className="space-y-3 border-t border-sidebar-border px-3 py-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-sidebar-muted">Appearance</span>
                <ThemeToggle variant="sidebar" />
              </div>
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <UserIcon className="size-[18px]" /> Profile
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <ShieldCheck className="size-[18px]" /> Admin Panel
                </Link>
              )}
              <Separator className="bg-sidebar-border" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-destructive hover:bg-sidebar-accent"
              >
                <LogOut className="size-[18px]" /> Log out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export { MobileHeader };
