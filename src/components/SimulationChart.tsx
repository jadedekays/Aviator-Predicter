import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulationResult } from "@/src/types";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

interface SimulationChartProps {
  result: SimulationResult;
}

export function SimulationChart({ result }: SimulationChartProps) {
  const isProfit = result.totalProfit >= 0;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Profit/Loss Simulation Curve
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={result.profitHistory}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isProfit ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isProfit ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
            <XAxis 
              dataKey="round" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke={isProfit ? "#22c55e" : "#ef4444"} 
              fillOpacity={1} 
              fill="url(#colorBalance)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
