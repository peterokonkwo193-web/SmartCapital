import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SimulatedBadge } from "@/components/common/paper-trading-banner";
import { ALLOCATION } from "@/data/portfolio";

function AllocationCard() {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Asset Allocation</CardTitle>
          <CardDescription>How your live portfolio is distributed.</CardDescription>
        </div>
        <SimulatedBadge />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="size-[168px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ALLOCATION}
                  dataKey="percent"
                  nameKey="label"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={2}
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  {ALLOCATION.map((slice) => (
                    <Cell key={slice.label} fill={slice.colorVar} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full flex-1 space-y-3">
            {ALLOCATION.map((slice) => (
              <div key={slice.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 font-medium text-foreground">
                    <span className="size-2 rounded-full" style={{ backgroundColor: slice.colorVar }} />
                    {slice.label}
                  </span>
                  <span className="font-mono text-muted-foreground">{slice.percent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${slice.percent}%`, backgroundColor: slice.colorVar }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { AllocationCard };
