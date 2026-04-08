import { motion, AnimatePresence } from "motion/react";
import { Round } from "../types";

interface HistoryBarProps {
  rounds: Round[];
}

export function HistoryBar({ rounds }: HistoryBarProps) {
  // Get the last 15 rounds
  const recentRounds = [...rounds].reverse().slice(0, 15);

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier < 1.2) return "bg-slate-500 text-white";
    if (multiplier < 2.0) return "bg-blue-500 text-white";
    if (multiplier < 10.0) return "bg-purple-500 text-white";
    return "bg-pink-500 text-white";
  };

  return (
    <div className="w-full overflow-hidden bg-slate-900/80 backdrop-blur-sm border-b border-white/5 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2 shrink-0">
          History
        </span>
        <div className="flex items-center gap-1.5">
          <AnimatePresence initial={false}>
            {recentRounds.map((round) => (
              <motion.div
                key={round.id}
                initial={{ scale: 0, opacity: 0, x: -20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`px-3 py-1 rounded-full text-[11px] font-black font-mono shadow-sm shrink-0 ${getMultiplierColor(round.multiplier)}`}
              >
                {round.multiplier.toFixed(2)}x
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
