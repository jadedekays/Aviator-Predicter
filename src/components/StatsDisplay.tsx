import { Card, CardContent } from "@/components/ui/card";
import { SimulationResult } from "@/src/types";
import { Activity, ArrowDownRight, ArrowUpRight, Percent, Target } from "lucide-react";

interface StatsDisplayProps {
  result: SimulationResult;
}

export function StatsDisplay({ result }: StatsDisplayProps) {
  const isProfit = result.totalProfit >= 0;

  const stats = [
    {
      label: "Total Profit/Loss",
      value: `$${result.totalProfit.toFixed(2)}`,
      icon: isProfit ? ArrowUpRight : ArrowDownRight,
      color: isProfit ? "text-green-500" : "text-red-500",
      bg: isProfit ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      label: "Win Rate",
      value: `${result.winRate.toFixed(1)}%`,
      icon: Percent,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Max Drawdown",
      value: `$${result.maxDrawdown.toFixed(2)}`,
      icon: Activity,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "Final Balance",
      value: `$${result.finalBalance.toFixed(2)}`,
      icon: Target,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="bg-card/50 border-border/50 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </p>
              <p className={`text-lg font-bold font-mono ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
