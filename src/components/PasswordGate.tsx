import * as React from "react";
import { useState } from "react";
import { Lock, ShieldAlert, Loader2, ArrowRight, UserPlus, LogIn, Phone, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp, increment } from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

interface PasswordGateProps {
  onSuccess: (userData: any) => void;
}

export function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [lockouts, setLockouts] = useState<Record<string, number>>({});

  const ACCESS_KEY = "JADEDEKAYS2009";

  // Auto-fetch username when phone number is entered
  React.useEffect(() => {
    const fetchUsername = async () => {
      if (phoneNumber.length === 9) {
        setIsFetchingUser(true);
        try {
          const userRef = doc(db, "users", phoneNumber);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.username) {
              setUsername(data.username);
              if (mode === 'register') {
                setError("Number already registered. Switching to login...");
                setTimeout(() => {
                  setMode('login');
                  setError(null);
                }, 1500);
              }
            }
          } else {
            if (mode === 'login') {
              setUsername("");
            }
          }
        } catch (err) {
          console.error("Error fetching username:", err);
        } finally {
          setIsFetchingUser(false);
        }
      } else if (phoneNumber.length < 9 && mode === 'login') {
        setUsername("");
      }
    };
    fetchUsername();
  }, [phoneNumber, mode]);

  const speak = (text: string) => {
    const message = new SpeechSynthesisUtterance(text);
    message.rate = 0.9;
    message.pitch = 1;
    window.speechSynthesis.speak(message);
  };

  const handleAction = async () => {
    const now = Date.now();
    if (lockouts[phoneNumber] && now < lockouts[phoneNumber]) {
      setError("try again after 1 week");
      speak("try again after 1 week");
      return;
    }

    if (phoneNumber.length !== 9) {
      setError("wrong number");
      speak("wrong number");
      return;
    }

    if (password !== ACCESS_KEY) {
      setError("Wrong access key");
      speak("Wrong access key");
      return;
    }

    if (mode === 'register' && !username) {
      setError("Username required");
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
          
          if (userData.isBlocked) {
            setError("Access denied. You have been blocked.");
            speak("Access denied. You have been blocked.");
            setIsVerifying(false);
            return;
          }

          const createdAt = userData.createdAt?.toDate?.() || new Date(userData.createdAt);
          const twoMonthsAgo = new Date();
          twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
          
          const isExpired = phoneNumber !== '779208037' && createdAt < twoMonthsAgo;
          
          if (isExpired) {
            setError("Bot expired. Contact +263779208037 to renew.");
            speak("Your access has expired");
            setIsVerifying(false);
            return;
          }

          // Increment stats
          try {
            await setDoc(doc(db, "stats", "global"), {
              totalVisits: increment(1),
              todayVisits: increment(1)
            }, { merge: true });
          } catch (err) {
            console.error("Error updating stats:", err);
          }

          setSuccess("success");
          speak("system online");
          setTimeout(() => onSuccess(userData), 1000);
        } else {
          setError("Aint registered");
          speak("Aint registered");
          setIsVerifying(false);
        }
      } else {
        if (userSnap.exists()) {
          setError("Already registered. Please login.");
          setIsVerifying(false);
        } else {
          const newUser = {
            phoneNumber,
            username,
            password,
            isApproved: false,
            isPendingApproval: false,
            createdAt: serverTimestamp()
          };
          
          const path = `users/${phoneNumber}`;
          try {
            await setDoc(userRef, newUser);
            await setDoc(doc(db, "stats", "global"), {
              userCount: increment(1)
            }, { merge: true });

            setSuccess("success");
            speak("system online");
            setTimeout(() => onSuccess(newUser), 1000);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, path);
            setError("Connection error. Try again.");
            setIsVerifying(false);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError("Connection error. Try again.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans selection:bg-cyan-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full bg-[#0a0a0c] border border-cyan-500/20 rounded-[24px] p-8 shadow-[0_0_50px_rgba(0,255,255,0.05)] relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-[0.2em] text-cyan-400 uppercase italic drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            SYSTEM_ACCESS
          </h1>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] ml-1">
              OPERATOR_ID
            </label>
            <div className="relative">
              <Input 
                placeholder="USERNAME" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/40 border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 h-14 text-center font-mono tracking-widest text-cyan-50 rounded-xl"
                disabled={isVerifying}
              />
              {isFetchingUser && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] ml-1">
              PHONE_NUMBER
            </label>
            <div className="flex gap-2">
              <div className="flex items-center px-4 bg-black/40 border border-cyan-500/30 rounded-xl text-sm font-mono text-cyan-500/70">
                +263
              </div>
              <Input 
                placeholder="771234567" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="bg-black/40 border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 h-14 text-center font-mono tracking-widest text-cyan-50 rounded-xl flex-1"
                disabled={isVerifying}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] ml-1">
              ACCESS_KEY
            </label>
            <Input 
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/40 border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 h-14 text-center font-mono tracking-widest text-cyan-50 rounded-xl"
              disabled={isVerifying}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 animate-shake">
              <ShieldAlert className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <ArrowRight className="h-4 w-4" />
              {success}
            </div>
          )}

          <Button 
            onClick={handleAction} 
            disabled={isVerifying || phoneNumber.length < 9 || !password}
            className="w-full h-14 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-[0.98]"
          >
            {isVerifying ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'AUTHORIZE'
            )}
          </Button>
          
          <div className="flex justify-center pt-2">
            <button 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground hover:text-cyan-400 transition-colors"
              disabled={isVerifying}
            >
              {mode === 'login' ? "REGISTER_NEW_OPERATOR" : "RETURN_TO_LOGIN"}
            </button>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-8 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black opacity-30">
          CYBER_FLAW // NEURAL_LAB // v1.0.2
        </p>
      </div>
    </div>
  );
}
