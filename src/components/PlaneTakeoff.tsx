import { motion } from "motion/react";
import { Plane, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface PlaneTakeoffProps {
  estimatedMultiplier: number;
  isLive: boolean;
}

export function PlaneTakeoff({ estimatedMultiplier, isLive }: PlaneTakeoffProps) {
  const [displayValue, setDisplayValue] = useState(1.00);

  useEffect(() => {
    if (isLive) {
      const duration = 2000; // 2 seconds animation
      const start = 1.00;
      const end = estimatedMultiplier;
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out quad
        const current = start + (end - start) * (1 - Math.pow(1 - progress, 2));
        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [estimatedMultiplier, isLive]);

  return (
    <div className="relative h-48 w-full bg-slate-950 rounded-2xl overflow-hidden border border-primary/20 shadow-2xl shadow-primary/10">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      {/* Horizon Line */}
      <div className="absolute bottom-10 left-0 right-0 h-[1px] bg-primary/30" />

      {/* Plane Animation */}
      <motion.div 
        className="absolute bottom-10 left-10 z-10"
        initial={{ x: 0, y: 0, rotate: 0 }}
        animate={isLive ? { 
          x: [0, 100, 250], 
          y: [0, -20, -80],
          rotate: [0, -10, -25]
        } : {}}
        transition={{ duration: 3, ease: "easeOut", repeat: Infinity, repeatDelay: 1 }}
      >
        <div className="relative">
          <Plane className="h-10 w-10 text-primary fill-primary/20" />
          <motion.div 
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-1 bg-gradient-to-r from-transparent to-primary/50 blur-sm"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Multiplier Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black mb-1">Target Estimate</p>
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              {displayValue.toFixed(2)}
            </span>
            <span className="text-3xl font-black text-primary italic">x</span>
          </div>
        </motion.div>
      </div>

      {/* Decorative Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 bg-white rounded-full"
            initial={{ x: "100%", y: Math.random() * 100 + "%" }}
            animate={{ x: "-10%", opacity: [0, 1, 0] }}
            transition={{ 
              duration: Math.random() * 2 + 1, 
              repeat: Infinity, 
              delay: Math.random() * 2 
            }}
          />
        ))}
      </div>

      {/* Live Badge */}
      {isLive && (
        <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse">
          <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Live Analysis
        </div>
      )}
    </div>
  );
}
