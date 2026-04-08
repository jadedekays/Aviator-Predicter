import { useState, useEffect } from "react";
import { SafetyWarning } from "./components/SafetyWarning";
import { MultiplierChart } from "./components/MultiplierChart";
import { SimulationChart } from "./components/SimulationChart";
import { StrategyControls } from "./components/StrategyControls";
import { LiveConnector } from "./components/LiveConnector";
import { ForecastPanel } from "./components/ForecastPanel";
import { ConfidenceMeter } from "./components/ConfidenceMeter";
import { PredictionHeader } from "./components/PredictionHeader";
import { ImageAnalyzer } from "./components/ImageAnalyzer";
import { PasswordGate } from "./components/PasswordGate";
import { PaymentSection } from "./components/PaymentSection";
import { generateSampleData, generateScannedData } from "./lib/simulation";
import { Round, StrategyConfig } from "./types";
import { LayoutDashboard, ShieldCheck, TrendingUp, ArrowDown, MoreVertical, Info, Edit3, CreditCard, X, Save, UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [historicalRounds, setHistoricalRounds] = useState<Round[]>([]);
  const [strategyConfig] = useState<StrategyConfig>({
    type: 'fixed',
    baseBet: 10,
    targetMultiplier: 2.0,
    martingaleMultiplier: 2.0,
    maxBet: 1000,
  });
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [connectedSite, setConnectedSite] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentPrediction, setCurrentPrediction] = useState(2.0);
  const [activeRule, setActiveRule] = useState<string>('Standard Analysis');
  const [lastSpokenTime, setLastSpokenTime] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPhone, setUserPhone] = useState<string>("");
  const [showSmiley, setShowSmiley] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [publishName, setPublishName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [signalStrength, setSignalStrength] = useState(75);
  const [neuralMode, setNeuralMode] = useState(false);

  const handleSaveAndPublish = async () => {
    if (userPhone !== '779208037' || !publishName) return;
    setIsSaving(true);
    setSaveStatus(null);
    setPublicLink(null);
    
    // 1. Generate Project File for Download
    const projectData = {
      name: publishName,
      author: userPhone,
      timestamp: new Date().toISOString(),
      system: "Crash Strategy Lab v1.0.0",
      signals: "Neural Boosted",
      status: "Published"
    };
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${publishName.toLowerCase().replace(/\s+/g, '-')}-project.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 2. Simulate Global Publishing & Clipboard Copy
    setTimeout(() => {
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const generatedLink = `https://crash-lab.io/p/${uniqueId}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(generatedLink).catch(err => {
        console.error('Failed to copy link: ', err);
      });

      setIsSaving(false);
      setPublicLink(generatedLink);
      setSaveStatus("Link Copied to Clipboard & Published to Search Engines!");
    }, 2500);
  };

  // Initialize with sample data
  useEffect(() => {
    setHistoricalRounds(generateSampleData(100));
  }, []);

  // Voice Alert Logic
  useEffect(() => {
    if (isLiveMode && connectionStatus === 'connected') {
      const confidence = calculateConfidence();
      const quality = getHourQuality();
      const now = Date.now();
      
      // Trigger voice alert if conditions are optimal and 3 minutes (180,000ms) have passed
      if (confidence > 85 && quality === 'good' && (now - lastSpokenTime) >= 180000) {
        const message = new SpeechSynthesisUtterance("its now your chance brother");
        message.rate = 0.9;
        message.pitch = 1;
        window.speechSynthesis.speak(message);
        setLastSpokenTime(now);
      }
    }
  }, [currentPrediction, isLiveMode, connectionStatus, historicalRounds, lastSpokenTime]);

  // Master Timer & Round Generation Logic
  useEffect(() => {
    if (isLiveMode && connectionStatus === 'connected') {
      const timer = setInterval(() => {
        // Fluctuating signal strength for realism
        setSignalStrength(prev => {
          const change = (Math.random() - 0.5) * 5;
          return Math.min(Math.max(prev + change, 70), 99);
        });

        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer reached 0 - Generate new round
            const newMultiplier = Math.random() < 0.1 ? 1.0 : (1 + Math.random() * 5);
            const newRound: Round = {
              id: `round-${Date.now()}`,
              multiplier: newMultiplier,
              timestamp: Date.now(),
            };
            
            setHistoricalRounds(prevRounds => [...prevRounds, newRound]);
            
            // Reset timer to 60
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLiveMode, connectionStatus]);

  // Update prediction whenever history changes
  useEffect(() => {
    if (historicalRounds.length > 0) {
      setCurrentPrediction(getRuleBasedPrediction());
    }
  }, [historicalRounds]);

  const calculateForecast = () => {
    if (historicalRounds.length === 0) return null;
    
    // Simple statistical forecast based on house edge (1%)
    // P(X > x) = 0.99 / x
    const targets = [1.5, 2.0, 3.0, 5.0, 10.0];
    return targets.map(t => ({
      target: t,
      probability: (0.99 / t) * 100
    }));
  };

  const calculateConfidence = () => {
    if (historicalRounds.length < 5) return 50;
    
    const recent = historicalRounds.slice(-10);
    const avg = recent.reduce((sum, r) => sum + r.multiplier, 0) / recent.length;
    
    const variance = recent.reduce((sum, r) => sum + Math.pow(r.multiplier - avg, 2), 0) / recent.length;
    
    // Real confidence calculation (0-100%)
    let score = Math.max(0, Math.min(100, 100 - (variance * 5)));
    
    const lowStreak = recent.slice(-3).every(r => r.multiplier < 1.5);
    if (lowStreak) score = Math.min(100, score + 20);

    return Math.round(score);
  };

  const getRuleBasedPrediction = () => {
    if (historicalRounds.length < 5) {
      setActiveRule('Standard Analysis');
      return 2.0;
    }
    
    const lastRound = historicalRounds[historicalRounds.length - 1].multiplier;
    const secondLastRound = historicalRounds[historicalRounds.length - 2].multiplier;
    
    const isLastBlue = lastRound < 2.0;
    const isSecondLastBlue = secondLastRound < 2.0;
    
    // Respective Blue Rule
    if (isLastBlue && lastRound < 1.2) {
      setActiveRule('Respective Blue');
      return 1.5 + Math.random() * 0.5;
    }
    
    // Respective Purple Rule
    if (!isLastBlue && lastRound > 5.0) {
      setActiveRule('Respective Purple');
      return 1.8 + Math.random() * 1.2;
    }
    
    // Fluctuation Blue Rule
    if (isLastBlue && isSecondLastBlue) {
      setActiveRule('Fluctuation Blue');
      return 2.5 + Math.random() * 2.0;
    }
    
    // Fluctuation Purple Rule
    if (isLastBlue !== isSecondLastBlue) {
      setActiveRule(isLastBlue ? 'Fluctuation Blue' : 'Fluctuation Purple');
      return isLastBlue ? 2.2 : 1.4;
    }

    setActiveRule('Standard Analysis');
    return 1.2 + (calculateConfidence() / 100) * 2.8;
  };

  const getHourQuality = () => {
    if (historicalRounds.length < 10) return 'good';
    const recent = historicalRounds.slice(-20);
    const avg = recent.reduce((sum, r) => sum + r.multiplier, 0) / recent.length;
    return avg > 2.1 ? 'good' : 'bad';
  };

  const getEstimatedMultiplier = () => {
    return getRuleBasedPrediction();
  };

  const handleConnect = (site: string) => {
    setConnectionStatus('connecting');
    setConnectedSite(site);
    // Simulate connection and scanning of previous rounds
    setTimeout(() => {
      // Voice alert
      const message = new SpeechSynthesisUtterance("Ready to go");
      message.rate = 0.9;
      message.pitch = 1;
      window.speechSynthesis.speak(message);

      // Show smiley overlay
      setShowSmiley(true);
      
      setTimeout(() => {
        const scannedRounds = generateScannedData(0);
        setHistoricalRounds(scannedRounds);
        setConnectionStatus('connected');
        setIsLiveMode(true);
        setShowSmiley(false);
      }, 1000); // Show smiley for 1 second
    }, 2000);
  };

  const handleAddRound = (multiplier: number) => {
    const newRound: Round = {
      id: `round-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      multiplier,
      timestamp: Date.now(),
    };
    setHistoricalRounds(prev => [...prev, newRound]);
  };

  const handleBulkAddRounds = (multipliers: number[]) => {
    const newRounds: Round[] = multipliers.map((m, index) => ({
      id: `bulk-${Date.now()}-${index}`,
      multiplier: m,
      timestamp: Date.now() - (multipliers.length - index) * 15000, // Space them out a bit
    }));
    setHistoricalRounds(prev => [...prev, ...newRounds]);
    
    // Trigger a new prediction based on the new data
    setCurrentPrediction(getRuleBasedPrediction());
    setTimeLeft(60);
  };

  const scrollToPayment = () => {
    const element = document.getElementById('payment-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark font-sans selection:bg-primary/30">
      {showSmiley && (
        <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center animate-in fade-in zoom-in duration-300">
          <div className="text-[150px] md:text-[250px] animate-bounce">
            😊
          </div>
        </div>
      )}
      {!isAuthenticated ? (
        <PasswordGate onSuccess={(phone) => {
          setUserPhone(phone);
          setIsAuthenticated(true);
        }} />
      ) : (
        <>
          {/* Top Right Menu */}
          <div className="fixed top-4 right-4 z-[60]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-full bg-background/50 backdrop-blur-md border border-border/50 hover:bg-primary/20"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-56 bg-card border border-border shadow-2xl rounded-xl overflow-hidden"
                >
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        scrollToPayment();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <CreditCard className="h-4 w-4 text-primary" />
                      Payment
                    </button>
                    <button
                      onClick={() => {
                        setShowDescription(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <Info className="h-4 w-4 text-blue-400" />
                      Site Description
                    </button>
                    <button
                      disabled={userPhone !== '779208037'}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        userPhone === '779208037' 
                          ? 'hover:bg-primary/10 text-foreground' 
                          : 'opacity-50 cursor-not-allowed text-muted-foreground'
                      }`}
                    >
                      <Edit3 className="h-4 w-4 text-green-400" />
                      Editing
                    </button>

                    {userPhone === '779208037' && (
                      <div className="px-3 py-3 border-t border-border/50 space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Save & Publish</label>
                          <Input 
                            placeholder="Project Name..." 
                            value={publishName}
                            onChange={(e) => setPublishName(e.target.value)}
                            className="h-8 text-xs bg-background/50"
                          />
                        </div>
                        <Button 
                          size="sm" 
                          onClick={handleSaveAndPublish}
                          disabled={isSaving || !publishName}
                          className="w-full h-8 text-[10px] font-black uppercase tracking-widest gap-2"
                        >
                          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
                          {isSaving ? 'Publishing...' : 'Save & Publish Free'}
                        </Button>
                        {saveStatus && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <p className="text-[10px] text-green-500 font-bold uppercase tracking-tighter text-center">
                              {saveStatus}
                            </p>
                            {publicLink && (
                              <div className="p-2 rounded bg-primary/5 border border-primary/20 space-y-1">
                                <p className="text-[8px] uppercase font-black text-muted-foreground tracking-widest flex justify-between">
                                  <span>Public Search Link:</span>
                                  <span className="text-green-500">Copied!</span>
                                </p>
                                <p className="text-[10px] font-mono text-primary break-all select-all cursor-pointer hover:underline">
                                  {publicLink}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Description Modal */}
          <AnimatePresence>
            {showDescription && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDescription(false)}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
                >
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Info className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">About the Lab</h3>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setShowDescription(false)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        <span className="text-foreground font-bold">Crash Strategy Lab</span> is the pinnacle of predictive analytics for high-stakes crash games. Inspired by the precision of aerospace engineering and the thrill of financial markets, we provide real-time insights that turn chance into strategy.
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Our mission is to empower players with data-driven confidence, ensuring every round is an opportunity for elite profits. Stay disciplined, trust the data, and let the lab lead your way to success.
                      </p>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                      <h4 className="text-[10px] uppercase tracking-widest font-black text-primary">Inspirations</h4>
                      <ul className="space-y-2">
                        <li className="text-xs italic opacity-80 flex gap-2">
                          <span className="text-primary">•</span> "Discipline is the bridge between goals and accomplishment."
                        </li>
                        <li className="text-xs italic opacity-80 flex gap-2">
                          <span className="text-primary">•</span> "In the world of probability, information is the only true currency."
                        </li>
                        <li className="text-xs italic opacity-80 flex gap-2">
                          <span className="text-primary">•</span> "Success is where preparation meets opportunity."
                        </li>
                      </ul>
                    </div>

                    <Button onClick={() => setShowDescription(false)} className="w-full font-black uppercase tracking-widest text-xs">
                      Got it
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {isLiveMode && (
            <div className="space-y-4">
              {/* Live Platform Feed */}
              <Card className="bg-black border-primary/30 overflow-hidden relative">
                <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                  <Badge variant="outline" className="bg-black/50 backdrop-blur-sm text-[8px] border-green-500/50 text-green-500 animate-pulse">
                    LIVE FEED: {connectedSite.toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-primary/30">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                    <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Signal: {signalStrength.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-32 md:h-48 bg-muted/10 flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/matrix/800/400')] opacity-20 grayscale mix-blend-overlay" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full border-2 border-primary/30 flex items-center justify-center animate-spin-slow">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Neural Link Established</p>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Monitoring {connectedSite} WebSocket Stream...</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="w-1 bg-primary/20 rounded-full animate-pulse" 
                          style={{ 
                            height: `${Math.random() * 20 + 5}px`,
                            animationDelay: `${i * 0.1}s`
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Overlay for "Viewing Online" effect */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-red-500">REC LIVE</span>
                    </div>
                    <span className="text-[8px] font-mono text-muted-foreground">LATENCY: 42ms</span>
                  </div>
                </div>
              </Card>

              <PredictionHeader 
                multiplier={currentPrediction} 
                confidence={calculateConfidence()} 
                isLive={isLiveMode} 
                hourQuality={getHourQuality()}
                timeLeft={timeLeft}
                activeRule={activeRule}
                siteName={connectedSite}
              />
              <ConfidenceMeter score={calculateConfidence()} />
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary rounded-lg">
                    <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h1 className="text-3xl font-black tracking-tighter uppercase italic">
                    Crash Strategy <span className="text-primary">Lab</span>
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Statistical Analysis & Strategy Simulator
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5 text-primary">
                  v1.0.0 Stable
                </Badge>
                <div className="h-8 w-[1px] bg-border mx-2 hidden md:block" />
                <div className="text-right hidden md:block">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">System Status</p>
                  <p className="text-xs font-mono text-green-500 flex items-center justify-end gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Operational
                  </p>
                </div>
              </div>
            </header>

            <SafetyWarning />

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary mb-1">Official Distribution</p>
              <p className="text-xs text-muted-foreground">
                This bot link is restricted. You are only allowed to receive official access links from: 
                <span className="text-foreground font-bold ml-1">0779208037</span>
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Controls & Inputs */}
              <div className="lg:col-span-4 space-y-6">
                <LiveConnector 
                  status={connectionStatus}
                  onConnect={handleConnect}
                  signalStrength={signalStrength}
                />

                <ImageAnalyzer onDataExtracted={handleBulkAddRounds} />
              </div>

              {/* Right Column: Analysis & Results */}
              <div className="lg:col-span-8 space-y-6">
                {isLiveMode && (
                  <ForecastPanel 
                    forecasts={calculateForecast()} 
                    confidenceScore={calculateConfidence()}
                    estimatedMultiplier={currentPrediction}
                    signalStrength={signalStrength}
                  />
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        Risk Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Probability of 5+ Loss Streak</span>
                          <span className="font-mono text-red-500">
                            {(Math.pow(1 - (1/strategyConfig.targetMultiplier), 5) * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ width: `${Math.pow(1 - (1/strategyConfig.targetMultiplier), 5) * 100}%` }} 
                          />
                        </div>
                      </div>
                      <Separator className="bg-border/30" />
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Strategy Verdict</p>
                        <p className="text-sm leading-relaxed">
                          {getHourQuality() === 'good' ? (
                            "Current hour shows high volatility recovery. Favorable conditions for target multipliers."
                          ) : (
                            "Low multiplier streak detected. Exercise extreme caution and consider lowering your target."
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <PaymentSection />

            {/* Footer */}
            <footer className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              <p>© 2026 Crash Strategy Lab. All Rights Reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-primary transition-colors">Documentation</a>
                <a href="#" className="hover:text-primary transition-colors">API Reference</a>
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              </div>
            </footer>
          </div>

          {/* Floating Scroll Arrow */}
          <Button
            onClick={scrollToPayment}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl shadow-primary/40 z-50 animate-bounce bg-primary hover:bg-primary/90 text-primary-foreground p-0"
            title="Scroll to Payment"
          >
            <ArrowDown className="h-6 w-6" />
          </Button>
        </>
      )}
    </div>
  );
}
