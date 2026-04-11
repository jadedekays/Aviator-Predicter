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
import { DynamicIsland } from "./components/DynamicIsland";
import { AdminTracker } from "./components/AdminTracker";
import { generateSampleData, generateScannedData } from "./lib/simulation";
import { Round, StrategyConfig } from "./types";
import { LayoutDashboard, ShieldCheck, TrendingUp, ArrowDown, MoreVertical, Info, Edit3, CreditCard, X, UserCheck, Users, PlayCircle, AlertCircle, Loader2, LogIn, LogOut, Save, Upload, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "motion/react";
import { db } from "./firebase";
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, getDoc, increment, setDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";

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
  // We don't throw here to avoid crashing the app, but we log it clearly
}

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
  const [lastWarningTime, setLastWarningTime] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [userPhone, setUserPhone] = useState<string>("");
  const [userName, setUserName] = useState<string>("Guest Pilot");
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSmiley, setShowSmiley] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [signalStrength, setSignalStrength] = useState(75);
  const [neuralMode, setNeuralMode] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [bettingPassword, setBettingPassword] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    totalVisits: 0,
    onlineUsers: 0,
    todayVisits: 0,
    uniqueIPs: 0,
    blockedUsers: 0
  });

  // Track Google Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setGoogleUser(user);
    });
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setGoogleAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setGoogleAuthError("Login cancelled. Please keep the window open.");
      } else if (err.code === 'auth/blocked-at-load') {
        setGoogleAuthError("Popup blocked. Please allow popups for this site.");
      } else {
        console.error("Google Login failed:", err);
        setGoogleAuthError("Login failed. Please try again.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Fetch total user count and active users
  useEffect(() => {
    const path = "stats/global";
    const unsub = onSnapshot(doc(db, path), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTotalUsers(data.userCount || 0);
        setActiveUsers(data.activeUsers || 0);
        setStats({
          totalVisits: data.totalVisits || 0,
          onlineUsers: data.activeUsers || 0,
          todayVisits: data.todayVisits || 0,
          uniqueIPs: data.uniqueIPs || 0,
          blockedUsers: data.blockedCount || 0
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    
    return () => unsub();
  }, []);

  // Midnight reset for todayVisits
  useEffect(() => {
    const checkMidnight = async () => {
      const now = new Date();
      const lastReset = localStorage.getItem('lastStatsResetDate');
      const today = now.toDateString();

      if (lastReset !== today) {
        const path = "stats/global";
        try {
          await setDoc(doc(db, path), {
            todayVisits: 0
          }, { merge: true });
          localStorage.setItem('lastStatsResetDate', today);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    };

    const interval = setInterval(checkMidnight, 60000);
    checkMidnight();
    return () => clearInterval(interval);
  }, []);

  // Track active session
  useEffect(() => {
    if (isAuthenticated) {
      const path = "stats/global";
      const incrementActive = async () => {
        try {
          await setDoc(doc(db, path), {
            activeUsers: increment(1)
          }, { merge: true });

          if (userPhone) {
            await setDoc(doc(db, "users", userPhone), {
              isOnline: true,
              lastSeen: serverTimestamp()
            }, { merge: true });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      };

      const decrementActive = async () => {
        try {
          await setDoc(doc(db, path), {
            activeUsers: increment(-1)
          }, { merge: true });

          if (userPhone) {
            await setDoc(doc(db, "users", userPhone), {
              isOnline: false,
              lastSeen: serverTimestamp()
            }, { merge: true });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      };

      incrementActive();

      const handleUnload = () => {
        // Use sendBeacon or a synchronous-ish update if possible, 
        // but for Firestore we just have to hope the async call finishes or use a heartbeat in a real app.
        decrementActive();
      };

      window.addEventListener('beforeunload', handleUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleUnload);
        decrementActive();
      };
    }
  }, [isAuthenticated]);

  // Listen for user approval status
  useEffect(() => {
    if (isAuthenticated && userPhone) {
      const path = `users/${userPhone}`;
      const unsub = onSnapshot(doc(db, "users", userPhone), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setIsApproved(data.isApproved || false);
          setIsPendingApproval(data.isPendingApproval || false);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
      return () => unsub();
    }
  }, [isAuthenticated, userPhone]);

  // Handle approval via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const approvePhone = params.get('approve');
    if (approvePhone && userPhone === '779208037') {
      const path = `users/${approvePhone}`;
      const approveUser = async () => {
        try {
          await setDoc(doc(db, "users", approvePhone), {
            isApproved: true,
            isPendingApproval: false
          }, { merge: true });
          alert(`User +263${approvePhone} approved successfully!`);
          // Clear URL param
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      };
      approveUser();
    }
  }, [userPhone]);

  // Fetch pending users for creator
  useEffect(() => {
    if (userPhone === '779208037') {
      const path = "users";
      const q = query(collection(db, "users"), where("isPendingApproval", "==", true));
      const unsub = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => doc.data());
        setPendingUsers(users);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      });
      return () => unsub();
    }
  }, [userPhone]);

  const handleSaveBot = () => {
    const prompt = `### AVIATOR PREDICTOR BOT: SYSTEM ARCHITECTURE
- Name: Aviator Predictor Lab (v1.0.0 Stable)
- Creator: jadedekays@gmail.com
- Admin ID: +263779208037
- Theme: Futuristic Cyber-Lab / Aerospace Engineering
- Access Key: JADEDEKAYS2009

### CORE LOGIC & RULES
1. Respective Blue Rule (1.0x - 1.9x):
   - Pattern: Consecutive blue multipliers.
   - Strategy: Wait for streak to end. Bet on first Purple/Pink.

2. Respective Purple Rule (2.0x - 9.9x):
   - Pattern: Consecutive purple multipliers.
   - Strategy: Continue betting until streak breaks.

3. Fluctuation Rule:
   - Pattern: Alternating Blue/Purple rounds.
   - Strategy: Follow the rhythm (e.g., 2 Blue -> 2 Purple).

### SYSTEM FEATURES
- Neural Link Stabilization (Signal Strength Tracking)
- Real-time WebSocket Simulation (Mwos, Winbucks, SpinCity)
- Voice Alerts: "its now your chance brother", "do not place bet"
- Admin Tracker: User Management, Blocking/Unblocking
- Dynamic Island: Round Tracking (1/1,000,000)`;

    // Capturing the current application state and code
    const code = `// AVIATOR PREDICTOR BOT - FULL SOURCE CODE SNAPSHOT
// Generated: ${new Date().toLocaleString()}
// This file contains the complete bot prompt and the current application structure.

${document.documentElement.outerHTML}`;

    const content = `${prompt}\n\n### FULL SOURCE CODE & PROMPT\n${code}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Aviator_Bot_Full_System_Backup.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const message = new SpeechSynthesisUtterance("Bot prompt and codes saved as file");
    window.speechSynthesis.speak(message);
    setShowMenu(false);
  };

  const handlePublish = () => {
    // Opening anything.com to publish this website as requested
    const currentUrl = window.location.href;
    const publishUrl = `https://anything.com/publish?url=${encodeURIComponent(currentUrl)}&app=Aviator_Predictor_Lab&action=publish_now`;
    window.open(publishUrl, '_blank');
    
    const message = new SpeechSynthesisUtterance("Opening anything dot com to publish this website");
    window.speechSynthesis.speak(message);
    setShowMenu(false);
  };

  const handleBlockUser = async () => {
    const phone = prompt("Enter phone number to block (+263...):");
    if (!phone) return;
    
    const cleanPhone = phone.replace(/\D/g, '').slice(-9);
    const path = `users/${cleanPhone}`;
    try {
      await setDoc(doc(db, "users", cleanPhone), {
        isBlocked: true
      }, { merge: true });
      
      await setDoc(doc(db, "stats", "global"), {
        blockedCount: increment(1)
      }, { merge: true });

      alert(`User +263${cleanPhone} blocked successfully.`);
      const message = new SpeechSynthesisUtterance("User blocked");
      window.speechSynthesis.speak(message);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    setShowMenu(false);
  };

  const handleLogout = () => {
    const message = new SpeechSynthesisUtterance("Logging out");
    window.speechSynthesis.speak(message);
    setUserPhone("");
    setUserName("Guest Pilot");
    setIsApproved(false);
    setIsPendingApproval(false);
    setCurrentUserData(null);
    localStorage.removeItem('bot_user_data');
    setShowMenu(false);
    setIsLiveMode(false);
    setConnectionStatus('disconnected');
    setIsAuthenticated(false);
  };

  const handleApproveUser = async (phone: string) => {
    const path = `users/${phone}`;
    try {
      await setDoc(doc(db, "users", phone), {
        isApproved: true,
        isPendingApproval: false
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleSetBettingPassword = async (password: string) => {
    if (!userPhone) return;
    const path = `users/${userPhone}`;
    try {
      await setDoc(doc(db, "users", userPhone), {
        bettingSitePassword: password
      }, { merge: true });
      
      // Update local state
      setCurrentUserData((prev: any) => ({
        ...prev,
        bettingSitePassword: password
      }));
      setBettingPassword(password);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Initialize rounds with persistence and midnight reset
  useEffect(() => {
    // Load saved user data
    const savedUser = localStorage.getItem('bot_user_data');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUserData(userData);
        setUserPhone(userData.phoneNumber);
        setUserName(userData.username || "Guest Pilot");
        setIsApproved(userData.isApproved || false);
        setIsPendingApproval(userData.isPendingApproval || false);
      } catch (e) {
        console.error("Error loading saved user", e);
      }
    }

    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('lastRoundResetDate');
    const saved = localStorage.getItem('historicalRounds');

    if (lastReset !== today) {
      // New day, start fresh with some sample data
      const initialRounds = generateSampleData(100);
      setHistoricalRounds(initialRounds);
      localStorage.setItem('lastRoundResetDate', today);
      localStorage.setItem('historicalRounds', JSON.stringify(initialRounds));
    } else if (saved) {
      try {
        setHistoricalRounds(JSON.parse(saved));
      } catch (e) {
        setHistoricalRounds(generateSampleData(100));
      }
    } else {
      setHistoricalRounds(generateSampleData(100));
    }
  }, []);

  // Save rounds to localStorage
  useEffect(() => {
    if (historicalRounds.length > 0) {
      localStorage.setItem('historicalRounds', JSON.stringify(historicalRounds));
    }
  }, [historicalRounds]);

  // Midnight check interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const lastReset = localStorage.getItem('lastRoundResetDate');
      const today = now.toDateString();

      if (lastReset && lastReset !== today) {
        setHistoricalRounds([]);
        localStorage.setItem('lastRoundResetDate', today);
        localStorage.removeItem('historicalRounds');
      }
    }, 60000);
    return () => clearInterval(interval);
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

      // Warning alert if multiplier is less than 1.5X
      if (currentPrediction < 1.5 && (now - lastWarningTime) >= 60000) {
        const message = new SpeechSynthesisUtterance("do not place bet");
        message.rate = 0.9;
        message.pitch = 1;
        window.speechSynthesis.speak(message);
        setLastWarningTime(now);
      }
    }
  }, [currentPrediction, isLiveMode, connectionStatus, historicalRounds, lastSpokenTime, lastWarningTime]);

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
            // Timer reached 0 - Generate new round based on site
            let newMultiplier;
            if (connectedSite.includes('spincity')) {
              // SpinCity specific pattern: High volatility, neural boosted signals
              // 15% chance of instant crash (1.0x)
              // 15% chance of high spike (15x+)
              // 70% chance of normal distribution (1.2x - 6x)
              const rand = Math.random();
              if (rand < 0.15) {
                newMultiplier = 1.0;
              } else if (rand > 0.85) {
                newMultiplier = 15 + Math.random() * 35;
              } else {
                newMultiplier = 1.2 + Math.random() * 4.8;
              }
            } else if (connectedSite.includes('mwos')) {
              // Mwos: Balanced, steady signals
              // 8% chance of instant crash
              // 92% chance of 1.1x - 5.5x
              newMultiplier = Math.random() < 0.08 ? 1.0 : (1.1 + Math.random() * 4.4);
            } else if (connectedSite.includes('winbucks')) {
              // Winbucks: Aggressive spikes, frequent medium multipliers
              // 12% chance of instant crash
              // 25% chance of 8x+ spikes
              // 63% chance of 1.5x - 4.5x
              const rand = Math.random();
              if (rand < 0.12) {
                newMultiplier = 1.0;
              } else if (rand > 0.75) {
                newMultiplier = 8 + Math.random() * 12;
              } else {
                newMultiplier = 1.5 + Math.random() * 3;
              }
            } else {
              // Default fallback for custom sites
              newMultiplier = 1.1 + Math.random() * 3.9;
            }
            
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
      setActiveRule('Respective blue rule');
      return 1.5 + Math.random() * 0.5;
    }
    
    // Respective Purple Rule
    if (!isLastBlue && lastRound > 5.0) {
      setActiveRule('Respective purple rule');
      return 1.8 + Math.random() * 1.2;
    }
    
    // Fluctuation Blue Rule
    if (isLastBlue && isSecondLastBlue) {
      setActiveRule('Fluctuation blue rule');
      return 2.5 + Math.random() * 2.0;
    }
    
    // Fluctuation Purple Rule
    if (isLastBlue !== isSecondLastBlue) {
      setActiveRule(isLastBlue ? 'Fluctuation blue rule' : 'Fluctuation purple rule');
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

  const handleConnect = (site: string, password: string) => {
    // Check if site password is correct (Simulation: must be at least 4 chars and not "1234")
    // The user said "When wrong betting site password is entered, it doesn't log in"
    // I'll implement a more specific check in LiveConnector and handle it here if needed.
    
    setConnectionStatus('connecting');
    setConnectedSite(site);
    setBettingPassword(password);
    setSignalStrength(85 + Math.random() * 10); // Start with strong signals (85-95%)
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
        setHistoricalRounds(prev => prev.length > 0 ? prev : scannedRounds);
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

  if (!isAuthenticated) {
    return (
      <PasswordGate onSuccess={(userData) => {
        setCurrentUserData(userData);
        setUserPhone(userData.phoneNumber);
        setUserName(userData.username || "Guest Pilot");
        setIsApproved(userData.isApproved || false);
        setIsPendingApproval(userData.isPendingApproval || false);
        setIsAuthenticated(true);
        localStorage.setItem('bot_user_data', JSON.stringify(userData));
      }} />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark font-sans selection:bg-primary/30">
      <DynamicIsland 
        roundNumber={historicalRounds.length} 
        status={connectionStatus}
        signalStrength={signalStrength}
        userName={userName}
      />
      {showSmiley && (
        <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center animate-in fade-in zoom-in duration-300">
          <div className="text-[150px] md:text-[250px] animate-bounce">
            😊
          </div>
        </div>
      )}
          {/* Admin Panel for Creator */}
          {userPhone === '779208037' && (
            <div className="fixed bottom-24 right-6 z-50">
              <Button
                onClick={() => setShowAdmin(!showAdmin)}
                className="h-14 w-14 rounded-full shadow-2xl bg-green-600 hover:bg-green-700 text-white p-0 relative"
              >
                <Users className="h-6 w-6" />
                {pendingUsers.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-background">
                    {pendingUsers.length}
                  </span>
                )}
              </Button>

              <AnimatePresence>
                {showAdmin && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="absolute bottom-16 right-0 w-80 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
                  >
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest">Admin Control</h3>
                        <Badge variant="outline">{pendingUsers.length}</Badge>
                      </div>

                      {!googleUser ? (
                        <div className="space-y-3">
                          {googleAuthError && (
                            <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                              <AlertCircle className="h-3 w-3" />
                              {googleAuthError}
                            </div>
                          )}
                          <Button 
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading}
                            className="w-full bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-2"
                          >
                            {isGoogleLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                                Login as Admin
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded bg-primary/10 border border-primary/20">
                          <img src={googleUser.photoURL || ""} className="w-6 h-6 rounded-full" alt="Admin" referrerPolicy="no-referrer" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold truncate">{googleUser.displayName}</p>
                            <p className="text-[8px] text-muted-foreground truncate">{googleUser.email}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => auth.signOut()}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      <Separator className="opacity-20" />

                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Approvals</h3>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {pendingUsers.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground text-center py-4 uppercase tracking-widest">No pending requests</p>
                        ) : (
                          pendingUsers.map((u) => (
                            <div key={u.phoneNumber} className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-mono font-bold">+263{u.phoneNumber}</p>
                                <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Awaiting Access</p>
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => handleApproveUser(u.phoneNumber)}
                                className="h-7 text-[8px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-700"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

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
                        setShowTutorial(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <PlayCircle className="h-4 w-4 text-primary" />
                      Tutorial
                    </button>
                    <button
                      onClick={() => {
                        setShowDetails(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <UserCheck className="h-4 w-4 text-primary" />
                      My Details
                    </button>
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
                      <button
                        onClick={handleSaveBot}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <Save className="h-4 w-4 text-cyan-400" />
                        Save Bot as File
                      </button>
                    )}

                    {userPhone === '779208037' && (
                      <button
                        onClick={handlePublish}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <Upload className="h-4 w-4 text-yellow-400" />
                        Publish
                      </button>
                    )}

                    {userPhone === '779208037' && (
                      <button
                        onClick={handleBlockUser}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        Block User
                      </button>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout System
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tutorial Modal */}
          <AnimatePresence>
            {showTutorial && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowTutorial(false)}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
                >
                  <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm z-10 pb-4 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <PlayCircle className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">Tutorial</h3>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setShowTutorial(false)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">How to use the Bot</h4>
                        <ul className="space-y-2">
                          <li className="flex gap-3 text-sm text-muted-foreground">
                            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                            <span>Connect to your preferred site (Mwos, Winbucks, or SpinCity) using your betting credentials.</span>
                          </li>
                          <li className="flex gap-3 text-sm text-muted-foreground">
                            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                            <span>Wait for the <strong>Neural Link</strong> to stabilize (Signal Strength above 70%).</span>
                          </li>
                          <li className="flex gap-3 text-sm text-muted-foreground">
                            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                            <span>Observe the <strong>Next Round Prediction</strong>. The bot will provide a target multiplier.</span>
                          </li>
                          <li className="flex gap-3 text-sm text-muted-foreground">
                            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                            <span>Place your bet and <strong>Cash Out</strong> exactly at the multiplier predicted by the bot for maximum safety.</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Bot Rules Section */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3" />
                        Bot Rules & Patterns
                      </h4>
                      
                      <div className="space-y-6">
                        {/* Respective Blue Rule */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Respective Blue Rule</span>
                            <Badge variant="outline" className="text-[8px] border-blue-500/30 text-blue-400">1.0x - 1.9x</Badge>
                          </div>
                          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 space-y-2">
                            <div className="flex gap-1">
                              {[1.0, 1.7, 1.4, 1.2].map((m, i) => (
                                <div key={i} className="px-2 py-1 rounded bg-blue-500/20 text-[10px] font-mono text-blue-400 border border-blue-500/20">
                                  {m.toFixed(1)}x
                                </div>
                              ))}
                              <div className="px-2 py-1 rounded bg-purple-500/40 text-[10px] font-mono text-purple-400 border border-purple-500/40 animate-pulse">
                                2.5x
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              <span className="text-white font-bold uppercase tracking-tighter">Strategy:</span> Wait for the consecutive blue streak to end. Place your bet only when a <span className="text-purple-400">Purple</span> or <span className="text-pink-400">Pink</span> multiplier appears after the blues.
                            </p>
                          </div>
                        </div>

                        {/* Respective Purple Rule */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Respective Purple Rule</span>
                            <Badge variant="outline" className="text-[8px] border-purple-500/30 text-purple-400">2.0x - 9.9x</Badge>
                          </div>
                          <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 space-y-2">
                            <div className="flex gap-1">
                              {[2.8, 4.5, 3.2, 6.1].map((m, i) => (
                                <div key={i} className="px-2 py-1 rounded bg-purple-500/20 text-[10px] font-mono text-purple-400 border border-purple-500/20">
                                  {m.toFixed(1)}x
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              <span className="text-white font-bold uppercase tracking-tighter">Strategy:</span> Ride the wave! Continue placing bets as long as the <span className="text-purple-400">Purple</span> multipliers hit consecutively.
                            </p>
                          </div>
                        </div>

                        {/* Fluctuation Rule */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Fluctuation Rule</span>
                            <Badge variant="outline" className="text-[8px] border-yellow-500/30 text-yellow-400">Pattern Following</Badge>
                          </div>
                          <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10 space-y-2">
                            <div className="grid grid-cols-4 gap-1">
                              {[1.8, 1.0, 2.8, 6.9, 1.2, 1.6, 8.8, 7.8].map((m, i) => (
                                <div key={i} className={`px-1 py-1 rounded text-center text-[9px] font-mono border ${m < 2 ? 'bg-blue-500/10 text-blue-400 border-blue-500/10' : 'bg-purple-500/10 text-purple-400 border-purple-500/10'}`}>
                                  {m.toFixed(1)}x
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              <span className="text-white font-bold uppercase tracking-tighter">Strategy:</span> Identify the alternating rhythm. Follow the pattern (e.g., 2 Blues followed by 2 Purples) to time your entries.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button onClick={() => setShowTutorial(false)} className="w-full font-black uppercase tracking-widest text-xs">
                      Start Winning
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* My Details Modal */}
          <AnimatePresence>
            {showDetails && currentUserData && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDetails(false)}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-sm bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
                >
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <UserCheck className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">My Details</h3>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setShowDetails(false)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
                        <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Username</p>
                        <p className="text-sm font-mono font-bold">{currentUserData.username}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
                        <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Phone Number</p>
                        <p className="text-sm font-mono font-bold">+263 {currentUserData.phoneNumber}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
                        <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Bot Password</p>
                        <p className="text-sm font-mono font-bold">{currentUserData.password}</p>
                      </div>
                      {(bettingPassword || currentUserData.bettingSitePassword) && (
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
                          <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Betting Site Password</p>
                          <p className="text-sm font-mono font-bold">{bettingPassword || currentUserData.bettingSitePassword}</p>
                        </div>
                      )}
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
                        <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Account Created</p>
                        <p className="text-sm font-mono font-bold">
                          {currentUserData.createdAt?.toDate ? currentUserData.createdAt.toDate().toLocaleString() : new Date(currentUserData.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Button onClick={() => setShowDetails(false)} className="w-full font-black uppercase tracking-widest text-xs">
                      Close
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

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
                  <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm z-10 pb-4 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Info className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">Lab Intelligence</h3>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setShowDescription(false)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        <span className="text-foreground font-bold">Crash Strategy Lab</span> is the pinnacle of predictive analytics for high-stakes crash games. Our mission is to empower players with data-driven confidence, ensuring every round is an opportunity for elite profits.
                      </p>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                      <h4 className="text-[10px] uppercase tracking-widest font-black text-primary">Core Principles</h4>
                      <ul className="space-y-2">
                        <li className="text-xs italic opacity-80 flex gap-2">
                          <span className="text-primary">•</span> "Discipline is the bridge between goals and accomplishment."
                        </li>
                        <li className="text-xs italic opacity-80 flex gap-2">
                          <span className="text-primary">•</span> "In the world of probability, information is the only true currency."
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

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary mb-1">Official Distribution</p>
                <p className="text-xs text-muted-foreground">
                  This bot link is restricted. You are only allowed to receive official access links from: 
                  <span className="text-foreground font-bold ml-1">0779208037</span>
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowTutorial(true)}
                className="h-8 text-[10px] font-black uppercase tracking-widest gap-2 border-primary/30 hover:bg-primary/10"
              >
                <PlayCircle className="h-3 w-3 text-primary" />
                Watch Video Tutorial
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Controls & Inputs */}
              <div className="lg:col-span-4 space-y-6">
                <LiveConnector 
                  status={connectionStatus}
                  onConnect={handleConnect}
                  signalStrength={signalStrength}
                  isApproved={isApproved}
                  onPaymentClick={scrollToPayment}
                  userPhone={userPhone}
                  userName={userName}
                  storedBettingPassword={currentUserData?.bettingSitePassword}
                  onSetBettingPassword={handleSetBettingPassword}
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

            <PaymentSection userPhone={userPhone} />

            {/* Footer */}
            <footer className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              <div className="flex flex-col gap-1">
                <p>© 2026 Crash Strategy Lab. All Rights Reserved.</p>
                <p className="text-primary animate-pulse">Live Operators Online: {activeUsers}</p>
              </div>
              <div className="flex gap-6">
                <a href="#" className="hover:text-primary transition-colors">Documentation</a>
                <a href="#" className="hover:text-primary transition-colors">API Reference</a>
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              </div>
            </footer>

            <div className="pt-12 pb-8 text-center space-y-4">
              <div className="inline-block p-4 rounded-2xl bg-black/40 border border-cyan-500/20 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black mb-2 opacity-50">Official Access Link</p>
                <a 
                  href="https://Jadede-kays-Aviator-predicter-bot.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 font-mono text-sm tracking-widest hover:text-cyan-300 transition-all hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                >
                  Jadede-kays-Aviator-predicter-bot.vercel.app
                </a>
              </div>
            </div>

            {userPhone === '779208037' && <AdminTracker adminPhone={userPhone} googleUser={googleUser} />}
          </div>
    </div>
  );
}
