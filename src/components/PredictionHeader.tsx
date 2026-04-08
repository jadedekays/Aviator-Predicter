import { motion } from "motion/react";
import { Timer, Zap, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface PredictionHeaderProps {
  multiplier: number;
  confidence: number;
  isLive: boolean;
  hourQuality: 'good' | 'bad';
  timeLeft: number;
  activeRule?: string;
  siteName?: string;
}

export function PredictionHeader({ multiplier, confidence, isLive, hourQuality, timeLeft, activeRule, siteName }: PredictionHeaderProps) {
  if (!isLive) return null;

  return (
    <div className="w-full bg-primary/10 border-y border-primary/20 py-8 px-4 relative overflow-hidden">
      {/* Active Rule Indicator */}
      <div className="absolute bottom-2 left-4 flex items-center gap-3">
        {activeRule && (
          <div className="px-2 py-0.5 bg-primary/20 border border-primary/30 rounded text-[8px] font-black uppercase tracking-widest text-primary animate-pulse">
            Rule: {activeRule}
          </div>
        )}
        {siteName && (
          <div className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-[8px] font-black uppercase tracking-widest text-green-400 flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-green-500 animate-ping" />
            Live: {siteName}
          </div>
        )}
      </div>

      {/* Hour Quality Emoji - Top Left Floating */}
      <div className="absolute top-4 left-4 flex flex-col items-start gap-1 z-30">
        <motion.span 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-4xl drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        >
          {hourQuality === 'good' ? '😊' : '😡'}
        </motion.span>
        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] shadow-lg backdrop-blur-md ${hourQuality === 'good' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {hourQuality === 'good' ? 'Good Hour' : 'Bad Hour'}
        </div>
      </div>

      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-3xl rounded-full" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 mt-8 relative z-10">
        {/* Prediction Display */}
        <div className="flex items-center gap-6">
          <div className="p-5 bg-primary rounded-3xl shadow-[0_0_40px_rgba(var(--primary),0.4)] border border-white/10">
            <TrendingUp className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-primary font-black mb-2 opacity-80">Next Round Prediction</p>
            <div className="flex items-baseline gap-3">
              <motion.span 
                key={multiplier}
                initial={{ y: 20, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                className="text-6xl font-black tracking-tighter text-foreground drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {multiplier.toFixed(2)}
              </motion.span>
              <span className="text-2xl font-black text-primary italic">x</span>
            </div>
          </div>
        </div>

        {/* Timer & Confidence */}
        <div className="flex gap-6 w-full md:w-auto">
          <div className="flex-1 md:w-56 p-6 bg-background/40 backdrop-blur-xl rounded-3xl border border-white/5 flex flex-col items-center justify-center shadow-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Timer className="h-5 w-5" />
              <span className="text-[11px] uppercase font-black tracking-widest">Valid For</span>
            </div>
            <span className={`text-4xl font-black font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
              00:{timeLeft.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex-1 md:w-56 p-6 bg-background/40 backdrop-blur-xl rounded-3xl border border-white/5 flex flex-col items-center justify-center shadow-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="text-[11px] uppercase font-black tracking-widest">Confidence</span>
            </div>
            <span className="text-4xl font-black font-mono text-green-500">
              {confidence}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
