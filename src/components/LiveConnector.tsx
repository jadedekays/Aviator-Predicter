import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Link2, Loader2, Phone, Wifi, WifiOff, Key, AlertCircle, Zap, Activity, UserCheck, CheckCircle2, Circle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";

interface LiveConnectorProps {
  status: 'disconnected' | 'connecting' | 'connected';
  onConnect: (site: string, password: string) => void;
  signalStrength?: number;
  isApproved: boolean;
  onPaymentClick: () => void;
  userPhone: string;
  userName: string;
  storedBettingPassword?: string;
  onSetBettingPassword: (password: string) => void;
}

export function LiveConnector({ 
  status, 
  onConnect, 
  signalStrength = 75, 
  isApproved, 
  onPaymentClick, 
  userPhone, 
  userName,
  storedBettingPassword,
  onSetBettingPassword
}: LiveConnectorProps) {
  const [site, setSite] = useState("mwos.co.ug");
  const [phoneNumber, setPhoneNumber] = useState(userPhone);
  const [bettingUsername, setBettingUsername] = useState(userName);
  const [bettingPassword, setBettingPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [dynamicSignal, setDynamicSignal] = useState(signalStrength);

  // Load remembered password if exists
  useEffect(() => {
    const saved = localStorage.getItem('remembered_betting_password');
    if (saved) {
      setBettingPassword(saved);
      setRememberMe(true);
    }
  }, []);

  // Dynamic signal strength fluctuation
  useEffect(() => {
    if (status === 'connected') {
      const interval = setInterval(() => {
        const fluctuation = 70 + Math.random() * 29;
        setDynamicSignal(fluctuation);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setDynamicSignal(signalStrength);
    }
  }, [status, signalStrength]);

  // Auto-fetch username when phone number is entered in the bridge
  useEffect(() => {
    const fetchUsername = async () => {
      if (phoneNumber.length === 9) {
        setIsFetchingUser(true);
        try {
          const { doc, getDoc } = await import("firebase/firestore");
          const { db } = await import("../firebase");
          const userRef = doc(db, "users", phoneNumber);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.username) {
              setBettingUsername(data.username);
            }
          }
        } catch (err) {
          console.error("Error fetching username:", err);
        } finally {
          setIsFetchingUser(false);
        }
      } else if (phoneNumber.length < 9) {
        setBettingUsername("");
      }
    };
    fetchUsername();
  }, [phoneNumber]);

  const handleSiteSelect = (selectedSite: string, name: string) => {
    setSite(selectedSite);
    const message = new SpeechSynthesisUtterance(name);
    message.rate = 1;
    message.pitch = 1;
    window.speechSynthesis.speak(message);
  };

  const handleConnect = () => {
    setLoginError(null);
    
    if (rememberMe) {
      localStorage.setItem('remembered_betting_password', bettingPassword);
    } else {
      localStorage.removeItem('remembered_betting_password');
    }

    if (!storedBettingPassword) {
      if (bettingPassword.length < 4) {
        setLoginError("Password must be at least 4 characters.");
        return;
      }
      onSetBettingPassword(bettingPassword);
      onConnect(site, bettingPassword);
      return;
    }

    if (bettingPassword !== storedBettingPassword) {
      setLoginError(`Incorrect password. Access denied.`);
      const message = new SpeechSynthesisUtterance("no, wrong password");
      message.rate = 0.9;
      message.pitch = 1;
      window.speechSynthesis.speak(message);
      return;
    }

    onConnect(site, bettingPassword);
  };

  const sites = [
    { id: "mwos.co.ug", name: "Mwos", color: "text-red-500", icon: "M" },
    { id: "winbucks.com", name: "Winbucks", color: "text-yellow-500", icon: "W" },
    { id: "spincity.com", name: "SpinCity", color: "text-purple-500", icon: "S" }
  ];

  return (
    <Card className="bg-card/50 border-border/50 overflow-hidden">
      <CardHeader className="pb-2 bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary animate-pulse" />
            Live Site Bridge
          </CardTitle>
          <Badge 
            variant={status === 'connected' ? 'default' : 'outline'}
            className={status === 'connected' ? 'bg-green-500 text-white relative border-none px-3 py-1' : 'px-3 py-1'}
          >
            {status === 'connected' ? (
              <>
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <Wifi className="h-3 w-3 mr-1.5" />
              </>
            ) : <WifiOff className="h-3 w-3 mr-1.5" />}
            <span className="font-black tracking-widest text-[10px]">{status.toUpperCase()}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-3">
          <label className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black ml-1">Target Platform</label>
          <div className="grid grid-cols-3 gap-2">
            {sites.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSiteSelect(s.id, s.name)}
                disabled={status !== 'disconnected'}
                className={`relative p-3 rounded-xl border transition-all flex flex-col items-center gap-2 group ${
                  site === s.id 
                    ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]' 
                    : 'bg-muted/30 border-border/50 hover:border-primary/50'
                } ${status !== 'disconnected' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 ${
                  site === s.id ? 'bg-primary text-primary-foreground border-primary' : `bg-muted border-border/50 ${s.color}`
                }`}>
                  {s.icon}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${site === s.id ? 'text-primary' : 'text-muted-foreground'}`}>
                  {s.name}
                </span>
                {site === s.id && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  </div>
                )}
                {status === 'connected' && site === s.id && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full animate-ping" />
                )}
              </button>
            ))}
          </div>
          <div className="relative">
            <Input 
              placeholder="e.g. mwos.co.ug" 
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="bg-background/50 border-border/50 font-mono text-xs tracking-widest h-10"
              disabled={status !== 'disconnected'}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {status === 'connected' ? <Wifi className="h-3 w-3 text-green-500" /> : <Circle className="h-3 w-3 text-muted-foreground/30" />}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black ml-1 flex items-center gap-2">
            <Phone className="h-3 w-3 text-primary" />
            Zimbabwe Phone Number
          </label>
          <div className="flex gap-2">
            <div className="flex items-center px-4 bg-muted/50 border border-border/50 rounded-xl text-xs font-mono text-muted-foreground">
              +263
            </div>
            <div className="relative flex-1">
              <Input 
                placeholder="771234567" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="bg-background/50 w-full border-border/50 font-mono tracking-widest h-10 rounded-xl"
                disabled={status !== 'disconnected'}
              />
              {isFetchingUser && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black ml-1 flex items-center gap-2">
              <UserCheck className="h-3 w-3 text-primary" />
              Betting Username
            </label>
            <Input 
              placeholder="Enter your site username" 
              value={bettingUsername}
              onChange={(e) => setBettingUsername(e.target.value)}
              className="bg-background/50 border-border/50 h-10 rounded-xl text-xs"
              disabled={status !== 'disconnected'}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black ml-1 flex items-center gap-2">
              <Key className="h-3 w-3 text-primary" />
              Betting Site Password
            </label>
            <Input 
              type="password"
              placeholder={storedBettingPassword ? "Enter password" : "Create betting site password"} 
              value={bettingPassword}
              onChange={(e) => setBettingPassword(e.target.value)}
              className="bg-background/50 border-border/50 h-10 rounded-xl text-xs"
              disabled={status !== 'disconnected'}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-1">
          <Checkbox 
            id="remember" 
            checked={rememberMe} 
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            className="border-primary/50 data-[state=checked]:bg-primary"
          />
          <label htmlFor="remember" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer select-none">
            Remember Password
          </label>
        </div>

        {loginError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest animate-shake">
            <AlertCircle className="h-4 w-4" />
            {loginError}
          </div>
        )}

        <Button 
          onClick={handleConnect} 
          disabled={status !== 'disconnected' || phoneNumber.length < 9 || !bettingPassword}
          className="w-full h-14 font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(var(--primary),0.2)] rounded-xl transition-all active:scale-[0.98]"
        >
          {status === 'connecting' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-3" />
              Establishing Neural Link...
            </>
          ) : (
            <>
              <Link2 className="h-5 w-5 mr-3" />
              Connect & Sync Live
            </>
          )}
        </Button>

        {status === 'connected' && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-500">
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${dynamicSignal >= 70 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${dynamicSignal >= 70 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <Activity className={`h-4 w-4 animate-pulse ${dynamicSignal >= 70 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Signal Strength</span>
              </div>
              <span className={`text-lg font-mono font-black ${dynamicSignal >= 70 ? 'text-green-500' : 'text-red-500'}`}>{dynamicSignal.toFixed(0)}%</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (!isApproved) {
                  onPaymentClick();
                  return;
                }
                setIsBoosting(true);
                setTimeout(() => setIsBoosting(false), 3000);
              }}
              disabled={isBoosting}
              className={`w-full h-12 text-[10px] font-black uppercase tracking-widest gap-3 border-primary/30 hover:bg-primary/10 rounded-xl ${!isApproved ? 'opacity-50' : ''}`}
            >
              {isBoosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className={`h-4 w-4 ${isApproved ? 'text-yellow-500' : 'text-muted-foreground'}`} />}
              {isBoosting ? "Boosting Signals..." : isApproved ? "Strengthen Neural Signals" : "Locked: Payment Required"}
            </Button>
            {!isApproved && (
              <p className="text-[8px] text-center text-red-500 font-black uppercase tracking-widest animate-pulse">
                Approved users only. Contact +263779208037
              </p>
            )}
          </div>
        )}

        <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Connection Info</p>
          </div>
          <p className="text-[10px] leading-relaxed opacity-70 italic font-medium">
            {status === 'connected' 
              ? `Successfully bridged with ${site} via +263${phoneNumber}. Monitoring live WebSocket stream for real-time crash prediction.`
              : "Enter your site and Zimbabwe phone number to establish a secure live bridge with our neural prediction engine."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
