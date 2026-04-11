import { motion, AnimatePresence } from "motion/react";
import { Zap, Activity, Wifi } from "lucide-react";

interface DynamicIslandProps {
  roundNumber: number;
  status: 'disconnected' | 'connecting' | 'connected';
  signalStrength: number;
  userName?: string;
}

export function DynamicIsland({ roundNumber, status, signalStrength, userName }: DynamicIslandProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
      <motion.div
        initial={{ width: 120, height: 36, borderRadius: 18, backgroundColor: "#000000" }}
        animate={{ 
          width: status === 'connected' ? 280 : 220,
          height: 36,
          borderRadius: 18,
          backgroundColor: ["#000000", "#0f172a", "#1e1b4b", "#000000"]
        }}
        transition={{ 
          width: { type: "spring", stiffness: 300, damping: 30 },
          backgroundColor: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
        className="border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-between px-4 overflow-hidden"
      >
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
            R#{roundNumber}/1,000,000
          </span>
          {userName && (
            <>
              <div className="h-3 w-[1px] bg-white/20 mx-1" />
              <span className="text-[9px] font-bold text-primary uppercase tracking-tighter truncate max-w-[60px]">
                {userName}
              </span>
            </>
          )}
        </div>

        <AnimatePresence mode="wait">
          {status === 'connected' ? (
            <motion.div
              key="connected"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center gap-1">
                <Wifi className={`h-3 w-3 ${signalStrength >= 70 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-[9px] font-mono font-bold ${signalStrength >= 70 ? 'text-green-500' : 'text-red-500'}`}>{signalStrength.toFixed(0)}%</span>
              </div>
              <div className="h-4 w-[1px] bg-white/10" />
              <Zap className="h-3 w-3 text-yellow-500 animate-pulse" />
            </motion.div>
          ) : (
            <motion.div
              key="disconnected"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <Activity className="h-3 w-3 text-muted-foreground" />
              <span className="text-[8px] font-bold uppercase tracking-tighter text-muted-foreground">Standby</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
