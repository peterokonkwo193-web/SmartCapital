import { TrendingUp, Wallet, Activity as ActivityIcon, User as UserIcon, Bell, Shield, Banknote } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { useActivities } from "@/hooks/use-activities";
import { formatDateTime } from "@/utils/format";

const ICON_MAP = {
  profit: TrendingUp,
  trade: Wallet,
  watchlist: ActivityIcon,
  profile: UserIcon,
  support: Bell,
  account: Banknote,
};

export function AccountActivityCard() {
  const { activities, loading } = useActivities();

  const recent = activities.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-500" />
            Profit Distributions &amp; Account Activity
          </CardTitle>
          <CardDescription>
            Live real-time feed of trading profits, deposits, and account balance credits.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {!loading && recent.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No profit payouts or activity yet"
            description="When trading profits or funds are credited by the administration, they will instantly reflect here and in your live balance."
          />
        ) : (
          <div className="space-y-2.5">
            {recent.map((activity) => {
              const isProfit = activity.type === "profit";
              const Icon = isProfit ? TrendingUp : (ICON_MAP[activity.type] ?? Shield);

              return (
                <div
                  key={activity.id}
                  className={`flex items-center gap-3.5 rounded-lg border p-3 transition-colors ${
                    isProfit
                      ? "border-emerald-500/30 bg-emerald-950/20 text-foreground"
                      : "border-border bg-muted/20 text-foreground"
                  }`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      isProfit
                        ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm font-medium leading-snug ${isProfit ? "text-emerald-300 font-semibold" : ""}`}>
                        {activity.message}
                      </p>
                      {isProfit && (
                        <Badge variant="success" className="h-5 px-1.5 text-[10px] font-mono font-semibold">
                          +PROFIT
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
