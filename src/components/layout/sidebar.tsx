import { BrandLockup } from "@/components/common/brand-mark";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { LanguageSelector } from "@/components/common/language-selector";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarUserMenu } from "@/components/layout/sidebar-user-menu";
import { Separator } from "@/components/ui/separator";

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center px-5">
        <BrandLockup className="[&_span]:text-sidebar-foreground [&_span_span]:text-sidebar-primary" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <SidebarNav />
      </div>

      <div className="px-3 pb-3 space-y-2">
        <div className="space-y-1.5 px-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sidebar-muted">Appearance</span>
            <ThemeToggle variant="sidebar" />
          </div>
          <div className="pt-1">
            <LanguageSelector variant="sidebar" />
          </div>
        </div>
        <Separator className="bg-sidebar-border" />
        <SidebarUserMenu />
      </div>
    </aside>
  );
}

export { Sidebar };
