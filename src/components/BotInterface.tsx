import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RotateCcw, Shield } from "lucide-react";

interface BotInterfaceProps {
  platform: string;
  onLogout: () => void;
  userPhone: string;
}

export function BotInterface({ platform, onLogout, userPhone }: BotInterfaceProps) {
  const [walletBalance, setWalletBalance] = useState("0.00");
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [status, setStatus] = useState("> CORE_v26.5_ONLINE... awaiting input_");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastTrend, setLastTrend] = useState<string | null>(null);
  const [history, setHistory] = useState<{ pred: string; time: string; result?: 'win' | 'loss' }[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const accuracy = wins + losses === 0 ? 0 : Math.round((wins / (wins + losses)) * 100);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour12: false });
  };

  const handleTrendInput = (trend: string) => {
    setLastTrend(trend);
    const message = new SpeechSynthesisUtterance(`${trend} trend registered`);
    window.speechSynthesis.speak(message);
    setStatus(`> TREND_INPUT: ${trend.toUpperCase()} ... ready for analysis_`);
  };

  const handleAnalyze = () => {
    if (!lastTrend) {
      const msg = "Please select market trend first";
      setStatus(`> ERROR: ${msg.toUpperCase()}_`);
      const speech = new SpeechSynthesisUtterance(msg);
      window.speechSynthesis.speak(speech);
      return;
    }

    setIsAnalyzing(true);
    setStatus("> ANALYZING_MARKET_DATA... PLEASE_WAIT_");
    
    setTimeout(() => {
      let pred = 0;
      if (lastTrend === 'blue') pred = 1 + Math.random() * 0.99;
      else if (lastTrend === 'purple') pred = 2 + Math.random() * 6.99;
      else pred = 9 + Math.random() * 41;

      const predStr = pred.toFixed(2) + "x";
      setPrediction(predStr);
      setIsAnalyzing(false);
      setStatus(`> ANALYSIS_COMPLETE: NEXT_SIGNAL_AT_${predStr}_`);
      
      setHistory(prev => [{ pred: predStr, time: formatTime(new Date()) }, ...prev].slice(0, 5));

      const speech = new SpeechSynthesisUtterance(`Next signal at ${predStr}`);
      window.speechSynthesis.speak(speech);
    }, 2000);
  };

  const handleWin = () => {
    setWins(prev => prev + 1);
    setPrediction(null);
    setStatus("> SIGNAL_SUCCESS... awaiting next input_");
    setHistory(prev => {
      const newHistory = [...prev];
      if (newHistory.length > 0) newHistory[0].result = 'win';
      return newHistory;
    });
    const speech = new SpeechSynthesisUtterance("Win registered. System optimized.");
    window.speechSynthesis.speak(speech);
  };

  const handleLoss = () => {
    setLosses(prev => prev + 1);
    setPrediction(null);
    setStatus("> SIGNAL_FAILED... recalibrating neural net_");
    setHistory(prev => {
      const newHistory = [...prev];
      if (newHistory.length > 0) newHistory[0].result = 'loss';
      return newHistory;
    });
    const speech = new SpeechSynthesisUtterance("Loss registered. Recalibrating.");
    window.speechSynthesis.speak(speech);
  };

  const resetBuffer = () => {
    setWins(0);
    setLosses(0);
    setPrediction(null);
    setLastTrend(null);
    setStatus("> BUFFER_RESET... system cleared_");
    const speech = new SpeechSynthesisUtterance("Buffer reset");
    window.speechSynthesis.speak(speech);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-sans flex flex-col gap-6 max-w-md mx-auto">
      {/* Wallet Balance */}
      <div className="relative">
        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-yellow-500 rounded-full" />
        <Card className="bg-[#0a0a0c] border-none p-6 rounded-2xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-4 text-center">
            OPERATOR WALLET BALANCE
          </p>
          <p className="text-4xl font-mono text-center tracking-tighter text-muted-foreground/80">
            {walletBalance}
          </p>
        </Card>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 bg-[#0a0a0c] p-4 rounded-2xl border border-white/5">
        <div className="text-center">
          <p className="text-xl font-black text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">
            {wins}<span className="text-[10px] text-muted-foreground ml-1 uppercase tracking-widest">WINS</span>
          </p>
        </div>
        <div className="text-center border-x border-white/5">
          <p className="text-xl font-black text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
            {losses}<span className="text-[10px] text-muted-foreground ml-1 uppercase tracking-widest">LOSSES</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
            {accuracy}%<span className="text-[10px] text-muted-foreground ml-1 uppercase tracking-widest">ACCURACY</span>
          </p>
        </div>
      </div>

      {/* Market Trend Input */}
      <Card className="bg-[#0a0a0c] border-none p-6 rounded-2xl relative overflow-hidden">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-6 text-center">
          MARKET TREND INPUT
        </p>
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => handleTrendInput('blue')}
            className={`h-16 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all ${
              lastTrend === 'blue' ? 'bg-blue-600 scale-95 ring-2 ring-blue-400' : 'bg-blue-600/80 hover:bg-blue-600'
            }`}
          >
            BLUE (1-1.99)
          </button>
          <button 
            onClick={() => handleTrendInput('purple')}
            className={`h-16 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all ${
              lastTrend === 'purple' ? 'bg-purple-600 scale-95 ring-2 ring-purple-400' : 'bg-purple-600/80 hover:bg-purple-600'
            }`}
          >
            PURPLE (2-8.99)
          </button>
          <button 
            onClick={() => handleTrendInput('pink')}
            className={`h-16 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all ${
              lastTrend === 'pink' ? 'bg-pink-600 scale-95 ring-2 ring-pink-400' : 'bg-pink-600/80 hover:bg-pink-600'
            }`}
          >
            PINK (9x+)
          </button>
        </div>
        <div className="mt-6 h-1 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-50" />
      </Card>

      {/* Platform Indicator */}
      <div className="text-center">
        <p className="text-sm font-black tracking-[0.3em] text-yellow-500 uppercase italic">
          PLATFORM: {platform.toUpperCase()}
        </p>
      </div>

      {/* Clock */}
      <div className="text-center py-4">
        <p className="text-6xl font-mono font-black text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] tracking-tighter">
          {formatTime(currentTime)}
        </p>
      </div>

      {/* Status Bar */}
      <div className="relative">
        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-cyan-500 rounded-full" />
        <div className="bg-black border border-white/5 p-4 rounded-xl font-mono text-[10px] text-cyan-400/80">
          <p>{status}</p>
        </div>
      </div>

      {/* Recent Signals History */}
      {history.length > 0 && (
        <Card className="bg-[#0a0a0c] border-none p-4 rounded-2xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-3">
            RECENT SIGNALS
          </p>
          <div className="space-y-2">
            {history.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] font-mono border-b border-white/5 pb-2 last:border-none">
                <span className="text-muted-foreground">{item.time}</span>
                <span className="font-black text-white italic">{item.pred}</span>
                {item.result ? (
                  <span className={item.result === 'win' ? 'text-green-500' : 'text-red-500'}>
                    {item.result.toUpperCase()}
                  </span>
                ) : (
                  <span className="text-yellow-500 animate-pulse">PENDING</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Prediction Display (if any) */}
      {prediction && !isAnalyzing && (
        <div className="text-center animate-in zoom-in duration-300">
          <p className="text-[10px] uppercase tracking-[0.5em] text-primary font-black mb-1">NEXT SIGNAL</p>
          <p className="text-7xl font-black text-white italic drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            {prediction}
          </p>
        </div>
      )}

      {/* Analyze Button */}
      <Button 
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl shadow-[0_0_20px_rgba(219,39,119,0.3)] transition-all active:scale-[0.98]"
      >
        {isAnalyzing ? <Loader2 className="h-6 w-6 animate-spin" /> : 'ANALYZE MARKET'}
      </Button>

      {/* Win/Loss Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          onClick={handleWin}
          className="h-14 bg-green-500 hover:bg-green-400 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-[0_0_15px_rgba(34,197,94,0.3)]"
        >
          WIN
        </Button>
        <Button 
          onClick={handleLoss}
          className="h-14 bg-red-500 hover:bg-red-400 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-[0_0_15px_rgba(239,68,68,0.3)]"
        >
          LOSS
        </Button>
      </div>

      {/* Footer Links */}
      <div className="flex justify-center gap-6 pt-4">
        <button 
          onClick={resetBuffer}
          className="text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:text-white transition-colors"
        >
          [ RESET_BUFFER ]
        </button>
        <button 
          onClick={onLogout}
          className="text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:text-red-500 transition-colors"
        >
          [ LOGOUT_SYSTEM ]
        </button>
      </div>

      <div className="text-center opacity-20 mt-4">
        <p className="text-[8px] uppercase tracking-[0.4em] font-black">
          CYBER_FLAW // NEURAL_LAB // v1.0.2
        </p>
      </div>
    </div>
  );
}
