import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Round } from "@/src/types";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

interface MultiplierChartProps {
  rounds: Round[];
}

export function MultiplierChart({ rounds }: MultiplierChartProps) {
  // Calculate distribution
  const distribution = [
    { range: "1.0x - 1.2x", count: 0, color: "#ef4444" },
    { range: "1.2x - 1.5x", count: 0, color: "#f97316" },
    { range: "1.5x - 2.0x", count: 0, color: "#eab308" },
    { range: "2.0x - 5.0x", count: 0, color: "#22c55e" },
    { range: "5.0x+", count: 0, color: "#3b82f6" },
  ];

  rounds.forEach((r) => {
    if (r.multiplier < 1.2) distribution[0].count++;
    else if (r.multiplier < 1.5) distribution[1].count++;
    else if (r.multiplier < 2.0) distribution[2].count++;
    else if (r.multiplier < 5.0) distribution[3].count++;
    else distribution[4].count++;
  });

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Multiplier Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distribution}>
            <XAxis 
              dataKey="range" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted) / 0.2)' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {distribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
