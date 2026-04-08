import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface ConfidenceMeterProps {
  score: number; // 0 to 100
}

export function ConfidenceMeter({ score }: ConfidenceMeterProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayScore(score), 500);
    return () => clearTimeout(timer);
  }, [score]);

  const getStatus = () => {
    if (displayScore > 80) return { label: "High Confidence", color: "text-green-500", bar: "bg-green-500" };
    if (displayScore > 50) return { label: "Moderate Signal", color: "text-yellow-500", bar: "bg-yellow-500" };
    return { label: "Low Confidence", color: "text-red-500", bar: "bg-red-500" };
  };

  const status = getStatus();

  return (
    <div className="space-y-3 p-4 rounded-xl bg-background/40 border border-border/50 backdrop-blur-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${status.color} animate-pulse`} />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Signal Strength
          </span>
        </div>
        <span className={`text-sm font-black font-mono ${status.color}`}>
          {displayScore}%
        </span>
      </div>
      
      <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden border border-border/20">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${status.bar}`}
          style={{ width: `${displayScore}%` }}
        >
          <div className="w-full h-full opacity-30 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className={`text-[10px] font-bold uppercase ${status.color}`}>
          {status.label}
        </span>
        <span className="text-[9px] text-muted-foreground italic">
          Updated live based on round volatility
        </span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
      `}} />
    </div>
  );
}
