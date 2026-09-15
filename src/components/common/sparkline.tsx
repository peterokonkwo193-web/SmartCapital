import { Line, LineChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  positive?: boolean;
  className?: string;
}

function Sparkline({ data, positive = true, className }: SparklineProps) {
  const points = data.map((value, index) => ({ index, value }));
  const color = positive ? "var(--color-success)" : "var(--color-destructive)";

  return (
    <div className={className} style={{ width: 96, height: 32 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.75} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export { Sparkline };
