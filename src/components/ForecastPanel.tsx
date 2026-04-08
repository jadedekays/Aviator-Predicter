import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Info, Sparkles, Cpu, Network, Zap } from "lucide-react";
import { PlaneTakeoff } from "./PlaneTakeoff";

interface ForecastPanelProps {
  forecasts: { target: number; probability: number }[] | null;
  confidenceScore: number;
  estimatedMultiplier: number;
  signalStrength?: number;
}

export function ForecastPanel({ forecasts, confidenceScore, estimatedMultiplier, signalStrength = 75 }: ForecastPanelProps) {
  if (!forecasts) return null;

  return (
    <Card className="bg-primary/5 border-primary/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="h-24 w-24 text-primary" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
            <BrainCircuit className="h-5 w-5" />
            Neural Signal Analysis
          </CardTitle>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Boosted</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <PlaneTakeoff estimatedMultiplier={estimatedMultiplier} isLive={true} />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-xl bg-background/40 border border-border/50 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Cpu className="h-3 w-3" />
              <span className="text-[8px] uppercase font-black tracking-widest">Processing</span>
            </div>
            <p className="text-sm font-mono font-bold">4.2 TFLOPS</p>
          </div>
          <div className="p-3 rounded-xl bg-background/40 border border-border/50 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Network className="h-3 w-3" />
              <span className="text-[8px] uppercase font-black tracking-widest">Neural Depth</span>
            </div>
            <p className="text-sm font-mono font-bold">128 Layers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {forecasts.map((f) => (
            <div key={f.target} className="space-y-1">
              <div className="flex justify-between text-sm items-end">
                <span className="font-bold text-muted-foreground">
                  Reach <span className="text-foreground">{f.target.toFixed(1)}x</span>
                </span>
                <span className="font-mono text-primary font-bold">
                  {f.probability.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${f.probability}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 p-2 rounded bg-background/50 border border-border/30">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-tight">
            Forecasts are based on the standard power-law distribution of crash games (1% house edge). 
            These are <strong>probabilities</strong>, not certainties.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
