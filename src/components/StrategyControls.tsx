import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StrategyConfig, StrategyType } from "@/types";
import { Play, RotateCcw, TrendingUp, Zap } from "lucide-react";

interface StrategyControlsProps {
  config: StrategyConfig;
  setConfig: (config: StrategyConfig) => void;
  onRun: () => void;
  onReset: () => void;
  isSimulating: boolean;
}

export function StrategyControls({ config, setConfig, onRun, onReset, isSimulating }: StrategyControlsProps) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Strategy Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs 
          value={config.type} 
          onValueChange={(v) => setConfig({ ...config, type: v as StrategyType })}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fixed">Fixed</TabsTrigger>
            <TabsTrigger value="martingale">Martingale</TabsTrigger>
            <TabsTrigger value="auto-cashout">Auto-Cash</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-muted-foreground">Base Bet Amount ($)</label>
              <span className="font-mono text-primary">${config.baseBet}</span>
            </div>
            <Slider 
              value={[config.baseBet]} 
              min={1} 
              max={1000} 
              step={1} 
              onValueChange={(v) => setConfig({ ...config, baseBet: v[0] })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-muted-foreground">Target Multiplier (x)</label>
              <span className="font-mono text-primary">{config.targetMultiplier}x</span>
            </div>
            <Slider 
              value={[config.targetMultiplier]} 
              min={1.1} 
              max={100} 
              step={0.1} 
              onValueChange={(v) => setConfig({ ...config, targetMultiplier: v[0] })}
            />
          </div>

          {config.type === 'martingale' && (
            <div className="space-y-4 pt-2 border-t border-border/30">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label className="text-muted-foreground">Loss Multiplier</label>
                  <span className="font-mono text-primary">{config.martingaleMultiplier}x</span>
                </div>
                <Slider 
                  value={[config.martingaleMultiplier || 2]} 
                  min={1.1} 
                  max={5} 
                  step={0.1} 
                  onValueChange={(v) => setConfig({ ...config, martingaleMultiplier: v[0] })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Max Bet Limit ($)</label>
                <Input 
                  type="number" 
                  value={config.maxBet} 
                  onChange={(e) => setConfig({ ...config, maxBet: Number(e.target.value) })}
                  className="bg-background/50"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button 
            onClick={onRun} 
            disabled={isSimulating}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
          >
            <Play className="mr-2 h-4 w-4" />
            Run Simulation
          </Button>
          <Button 
            variant="outline" 
            onClick={onReset}
            className="w-full border-border/50 hover:bg-accent"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
