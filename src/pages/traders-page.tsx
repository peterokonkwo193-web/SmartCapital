import { useEffect, useState } from "react";
import { Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { TrendValue } from "@/components/common/trend-value";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { TRADERS } from "@/data/traders";
import { formatNumber } from "@/utils/format";
import type { Trader } from "@/types";

const RISK_VARIANT = { Low: "success", Moderate: "warning", High: "destructive" } as const;

function TradersPage() {
  const [selected, setSelected] = useState<Trader | null>(null);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = "Trader Strategies — SmartCapital";
  }, []);

  function toggleFollow(trader: Trader) {
    setFollowing((prev) => {
      const next = new Set(prev);
      if (next.has(trader.id)) {
        next.delete(trader.id);
        toast.info(`Unfollowed ${trader.name}'s strategy`);
      } else {
        next.add(trader.id);
        toast.success(`Now following ${trader.name}'s strategy`, { description: "Their trades will appear in your feed." });
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trader Strategies"
        description="Browse top trader profiles and their live strategy performance metrics."
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {TRADERS.map((trader) => {
          const isFollowing = following.has(trader.id);
          return (
            <Card key={trader.id}>
              <CardHeader className="flex-row items-start gap-3 space-y-0">
                <Avatar className="size-11">
                  <AvatarFallback className="text-sm font-semibold">{trader.avatarInitials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{trader.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{trader.strategy}</p>
                </div>
                <Badge variant={RISK_VARIANT[trader.riskLevel]}>{trader.riskLevel}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{trader.bio}</p>

                <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-muted/30 px-3 py-3">
                  <Stat label="Return" value={<TrendValue value={trader.liveReturn} showIcon={false} className="text-sm" />} />
                  <Stat label="Win Rate" value={<span className="font-mono text-sm font-medium">{trader.winRate}%</span>} />
                  <Stat label="Experience" value={<span className="font-mono text-sm font-medium">{trader.experienceYears}y</span>} />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {formatNumber(trader.followers, { compact: true })} followers
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setSelected(trader)}>
                    View Strategy
                  </Button>
                  <Button className="flex-1" variant={isFollowing ? "secondary" : "default"} onClick={() => toggleFollow(trader)}>
                    {isFollowing ? "Following" : "Follow Strategy"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-11">
                    <AvatarFallback className="text-sm font-semibold">{selected.avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{selected.name}</DialogTitle>
                    <DialogDescription>{selected.strategy}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <p className="text-sm leading-relaxed text-muted-foreground">{selected.bio}</p>

              <div className="flex flex-wrap gap-1.5">
                {selected.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Return" value={<TrendValue value={selected.liveReturn} showIcon={false} />} />
                <Stat label="Win Rate" value={<span className="font-mono text-sm font-medium">{selected.winRate}%</span>} />
                <Stat label="Risk" value={<Badge variant={RISK_VARIANT[selected.riskLevel]}>{selected.riskLevel}</Badge>} />
                <Stat label="Experience" value={<span className="font-mono text-sm font-medium">{selected.experienceYears}y</span>} />
              </div>

              <div className="flex items-start gap-2 rounded-md border border-accent/30 bg-accent/10 px-3.5 py-3 text-xs text-muted-foreground">
                <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-accent" />
                Performance figures reflect real historical trading results. Past performance does not guarantee
                future results. Investing involves risk.
              </div>

              <Button className="w-full" onClick={() => toggleFollow(selected)}>
                {following.has(selected.id) ? "Unfollow Strategy" : "Follow Strategy"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="flex justify-center">{value}</div>
    </div>
  );
}

export default TradersPage;
