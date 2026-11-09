import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PaperTradingProvider } from "@/hooks/paper-trading-provider";
import { LiveMarketProvider } from "@/hooks/live-market-provider";
import { LiveTickerTape } from "@/components/markets/live-ticker-tape";
import { CustomerServiceWidget } from "@/components/common/customer-service-widget";
import { getCurrentLanguageCode } from "@/lib/languages";

function AppShell() {
  const location = useLocation();

  // Re-trigger Google Translate on client-side route transitions
  useEffect(() => {
    const lang = getCurrentLanguageCode();
    if (lang && lang !== "en") {
      const timer = setTimeout(() => {
        const combo = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
        if (combo && combo.value) {
          combo.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <LiveMarketProvider>
      <PaperTradingProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <MobileHeader />

          <div className="lg:pl-64">
            <LiveTickerTape />
            <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
              <Outlet />
            </main>
          </div>

          <BottomNav />
          <CustomerServiceWidget />
        </div>
      </PaperTradingProvider>
    </LiveMarketProvider>
  );
}

export { AppShell };
