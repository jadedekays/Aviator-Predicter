import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Link2, Loader2, Phone, Wifi, WifiOff, Key, AlertCircle, Zap, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface LiveConnectorProps {
  status: 'disconnected' | 'connecting' | 'connected';
  onConnect: (site: string) => void;
  signalStrength?: number;
}

export function LiveConnector({ status, onConnect, signalStrength = 75 }: LiveConnectorProps) {
  const [site, setSite] = useState("mwos.co.ug");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bettingPassword, setBettingPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isBoosting, setIsBoosting] = useState(false);

  const handleSiteSelect = (selectedSite: string, name: string) => {
    setSite(selectedSite);
    const message = new SpeechSynthesisUtterance(name);
    message.rate = 1;
    message.pitch = 1;
    window.speechSynthesis.speak(message);
  };

  const handleConnect = () => {
    setLoginError(null);
    
    // Simulate a basic validation check for the betting site password
    if (bettingPassword.length < 4) {
      setLoginError("Wrong password. Access denied.");
      const message = new SpeechSynthesisUtterance("no, wrong password");
      message.rate = 0.9;
      message.pitch = 1;
      window.speechSynthesis.speak(message);
      return;
    }

    onConnect(site);
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Live Site Bridge
          </CardTitle>
          <Badge 
            variant={status === 'connected' ? 'default' : 'outline'}
            className={status === 'connected' ? 'bg-green-500 text-white' : ''}
          >
            {status === 'connected' ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            {status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Target Platform</label>
          <div className="flex flex-wrap gap-2 mb-2">
            <Button 
              variant={site === "mwos.co.ug" ? "default" : "outline"}
              size="xs" 
              className="text-[10px] h-7 px-3 font-black uppercase tracking-wider"
              onClick={() => handleSiteSelect("mwos.co.ug", "Mwos")}
              disabled={status !== 'disconnected'}
            >
              Mwos
            </Button>
            <Button 
              variant={site === "winbucks.com" ? "default" : "outline"}
              size="xs" 
              className="text-[10px] h-7 px-3 font-black uppercase tracking-wider"
              onClick={() => handleSiteSelect("winbucks.com", "Winbucks")}
              disabled={status !== 'disconnected'}
            >
              Winbucks
            </Button>
          </div>
          <div className="flex gap-2">
            <Input 
              placeholder="e.g. mwos.co.ug" 
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="bg-background/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1">
            <Phone className="h-3 w-3" />
            Zimbabwe Phone Number
          </label>
          <div className="flex gap-2">
            <div className="flex items-center px-3 bg-muted/50 border border-border/50 rounded-md text-sm font-mono text-muted-foreground">
              +263
            </div>
            <Input 
              placeholder="771234567" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
              className="bg-background/50 flex-1"
              disabled={status !== 'disconnected'}
            />
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            Used to sync your account with the bot for live signals.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1">
            <Key className="h-3 w-3" />
            Betting Site Password
          </label>
          <Input 
            type="password"
            placeholder="Enter your site password" 
            value={bettingPassword}
            onChange={(e) => setBettingPassword(e.target.value)}
            className="bg-background/50"
            disabled={status !== 'disconnected'}
          />
        </div>

        {loginError && (
          <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle className="h-3 w-3" />
            {loginError}
          </div>
        )}

        <Button 
          onClick={handleConnect} 
          disabled={status !== 'disconnected' || phoneNumber.length < 9 || !bettingPassword}
          className="w-full h-12 font-black uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(var(--primary),0.2)]"
        >
          {status === 'connecting' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Establishing Neural Link...
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-2" />
              Connect & Sync Live
            </>
          )}
        </Button>

        {status === 'connected' && (
          <div className="space-y-3 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Signal Strength</span>
              </div>
              <span className="text-sm font-mono font-bold text-primary">{signalStrength.toFixed(0)}%</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setIsBoosting(true);
                setTimeout(() => setIsBoosting(false), 3000);
              }}
              disabled={isBoosting}
              className="w-full h-10 text-[10px] font-black uppercase tracking-widest gap-2 border-primary/30 hover:bg-primary/10"
            >
              {isBoosting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 text-yellow-500" />}
              {isBoosting ? "Boosting Signals..." : "Strengthen Neural Signals"}
            </Button>
          </div>
        )}

        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Connection Info</p>
          <p className="text-xs leading-relaxed opacity-80">
            {status === 'connected' 
              ? `Successfully bridged with ${site} via +263${phoneNumber}. Monitoring live WebSocket stream.`
              : "Enter your site and Zimbabwe phone number to establish a secure live bridge."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
