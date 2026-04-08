import * as React from "react";
import { useState } from "react";
import { Lock, ShieldAlert, Loader2, ArrowRight, UserPlus, LogIn, Phone, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

interface PasswordGateProps {
  onSuccess: (phone: string) => void;
}

export function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [lockouts, setLockouts] = useState<Record<string, number>>({});

  const speak = (text: string) => {
    const message = new SpeechSynthesisUtterance(text);
    message.rate = 0.9;
    message.pitch = 1;
    window.speechSynthesis.speak(message);
  };

  const handleAction = async () => {
    // Check if user is currently locked out
    const now = Date.now();
    if (lockouts[phoneNumber] && now < lockouts[phoneNumber]) {
      setError("try again after 1 week");
      speak("try again after 1 week");
      return;
    }

    // Basic Zimbabwe number validation (must be 9 digits)
    if (phoneNumber.length !== 9) {
      setError("wrong number");
      speak("wrong number");
      return;
    }

    if (password.length < 4) {
      setError("Invalid password length");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setSuccess(null);

    try {
      const userRef = doc(db, "users", phoneNumber);
      const userSnap = await getDoc(userRef);

      if (mode === 'login') {
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.password === password) {
            // Reset attempts on success
            setAttempts(prev => ({ ...prev, [phoneNumber]: 0 }));
            setSuccess("success");
            speak("system online");
            setTimeout(() => onSuccess(phoneNumber), 1000);
          } else {
            // Increment attempts
            const currentAttempts = (attempts[phoneNumber] || 0) + 1;
            setAttempts(prev => ({ ...prev, [phoneNumber]: currentAttempts }));

            if (currentAttempts >= 3) {
              // Lock out for 1 week (7 days * 24h * 60m * 60s * 1000ms)
              const lockoutTime = now + (7 * 24 * 60 * 60 * 1000);
              setLockouts(prev => ({ ...prev, [phoneNumber]: lockoutTime }));
              setError("try again after 1 week");
              speak("try again after 1 week");
            } else {
              setError("wrong password writen");
              speak("no, wrong password");
            }
            setIsVerifying(false);
          }
        } else {
          setError("Aint registered");
          speak("Aint registered");
          setIsVerifying(false);
        }
      } else {
        // Register
        if (userSnap.exists()) {
          setError("Already registered. Please login.");
          setIsVerifying(false);
        } else {
          await setDoc(userRef, {
            phoneNumber,
            password,
            createdAt: serverTimestamp()
          });
          setSuccess("success");
          speak("system online");
          setTimeout(() => onSuccess(phoneNumber), 1000);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Connection error. Try again.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans selection:bg-primary/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <Card className="max-w-md w-full border-primary/20 bg-card/50 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight uppercase italic">
            System <span className="text-primary">{mode === 'login' ? 'Login' : 'Register'}</span>
          </CardTitle>
          <div className="flex justify-center mt-2 gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-primary/30 text-primary">
              Secure Node
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-blue-500/30 text-blue-400">
              v1.0.2
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1 flex items-center gap-1">
              <Phone className="h-3 w-3" /> Zimbabwe Phone Number
            </label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-muted/50 border border-border/50 rounded-md text-sm font-mono text-muted-foreground">
                +263
              </div>
              <Input 
                placeholder="771234567" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="bg-background/50 flex-1 font-mono tracking-widest"
                disabled={isVerifying}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1 flex items-center gap-1">
              <Key className="h-3 w-3" /> Bot Password
            </label>
            <Input 
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/50 font-mono tracking-widest"
              disabled={isVerifying}
            />
          </div>

          {error && (
            <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="h-3 w-3" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-2 rounded bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              {success}
            </div>
          )}

          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Access Protocol</p>
            <p className="text-[10px] leading-relaxed opacity-70 italic">
              Receive official access links only from <span className="text-primary font-bold">0779208037</span>. Unauthorized links are blocked.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={handleAction} 
            disabled={isVerifying || phoneNumber.length < 9 || !password}
            className="w-full h-12 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs group"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {mode === 'login' ? 'Initialize System' : 'Create Account'}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
          
          <button 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-primary transition-colors"
            disabled={isVerifying}
          >
            {mode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </CardFooter>
      </Card>
      
      <div className="fixed bottom-8 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold opacity-50">
          Crash Strategy Lab © 2026 | Secure Access Node
        </p>
      </div>
    </div>
  );
}
