import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";
import { PaperTradingBanner } from "@/components/common/paper-trading-banner";
import { TestimonialsSection } from "@/components/common/testimonials-section";
import { PortfolioHero } from "@/components/dashboard/portfolio-hero";
import { MarketSnapshot } from "@/components/dashboard/market-snapshot";
import { AllocationCard } from "@/components/dashboard/allocation-card";
import { RecentOrdersCard } from "@/components/dashboard/recent-orders-card";
import { AccountActivityCard } from "@/components/dashboard/account-activity-card";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardPage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Dashboard — SmartCapital";
  }, []);

  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-[15px]">Your live trading activity and portfolio at a glance.</p>
        </div>
        <PaperTradingBanner />
      </div>

      <PortfolioHero />

      <div className="grid gap-6 lg:grid-cols-2">
        <MarketSnapshot />
        <AllocationCard />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentOrdersCard />
        <AccountActivityCard />
      </div>

      <TestimonialsSection variant="embedded" />
    </div>
  );
}

export default DashboardPage;
