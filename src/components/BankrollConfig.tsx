import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Wallet } from "lucide-react";

interface BankrollConfigProps {
  balance: number;
  setBalance: (v: number) => void;
  rounds: number;
  setRounds: (v: number) => void;
}

export function BankrollConfig({ balance, setBalance, rounds, setRounds }: BankrollConfigProps) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Bankroll & Scope
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Starting Balance ($)</label>
          <Input 
            type="number" 
            value={balance} 
            onChange={(e) => setBalance(Number(e.target.value))}
            className="bg-background/50 font-mono text-primary font-bold"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="text-muted-foreground">Simulation Rounds</label>
            <span className="font-mono text-primary">{rounds}</span>
          </div>
          <Slider 
            value={[rounds]} 
            min={10} 
            max={5000} 
            step={10} 
            onValueChange={(v) => setRounds(v[0])}
          />
        </div>

        <div className="pt-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recommended Bet Size</p>
            <p className="text-sm font-semibold text-primary">
              ${(balance * 0.02).toFixed(2)} (2% of Bankroll)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
