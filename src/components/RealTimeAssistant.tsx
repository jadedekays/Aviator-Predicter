import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Round } from "@/src/types";
import { History, PlusCircle } from "lucide-react";
import { useState, FormEvent } from "react";

interface RealTimeAssistantProps {
  onAddRound: (multiplier: number) => void;
  rounds: Round[];
}

export function RealTimeAssistant({ onAddRound, rounds }: RealTimeAssistantProps) {
  const [val, setVal] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 1) {
      onAddRound(num);
      setVal("");
    }
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Live Round Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            type="number" 
            step="0.01" 
            placeholder="Round Multiplier (e.g. 2.45)" 
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="bg-background/50"
          />
          <Button type="submit" size="icon">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Rounds</p>
          <div className="flex flex-wrap gap-2">
            {rounds.slice(-10).reverse().map((r, i) => (
              <div 
                key={r.id} 
                className={`px-2 py-1 rounded text-xs font-mono font-bold border ${
                  r.multiplier >= 2 ? 'bg-green-500/10 border-green-500/20 text-green-500' : 
                  r.multiplier >= 1.5 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                  'bg-red-500/10 border-red-500/20 text-red-500'
                }`}
              >
                {r.multiplier.toFixed(2)}x
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
