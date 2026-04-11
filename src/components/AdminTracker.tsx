import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCcw, Users, UserMinus, Clock, ShieldAlert, Globe } from "lucide-react";
import { db } from "../firebase";
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs, where, setDoc, increment } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { X, Phone, Shield } from "lucide-react";

interface AdminTrackerProps {
  adminPhone: string;
  googleUser: any;
}

const LiquidGlassModal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-widest text-white drop-shadow-md">{title}</h3>
              <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {children}
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export function AdminTracker({ adminPhone, googleUser }: AdminTrackerProps) {
  const [stats, setStats] = useState({
    totalVisits: 0,
    onlineUsers: 0,
    todayVisits: 0,
    uniqueIPs: 0,
    blockedUsers: 0
  });
  const [visitors, setVisitors] = useState<any[]>([]);
  const [onlineUsersList, setOnlineUsersList] = useState<any[]>([]);
  const [blockedUsersList, setBlockedUsersList] = useState<any[]>([]);
  const [showOnlineList, setShowOnlineList] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockNumber, setBlockNumber] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED' | 'TODAY'>('ALL');

  useEffect(() => {
    const unsubStats = onSnapshot(doc(db, "stats", "global"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setStats({
          totalVisits: data.totalVisits || 0,
          onlineUsers: data.activeUsers || 0,
          todayVisits: data.todayVisits || 0,
          uniqueIPs: data.uniqueIPs || 0,
          blockedUsers: data.blockedCount || 0
        });
      }
    }, (error) => {
      console.error("AdminTracker Stats Error:", error);
    });

    let unsubVisitors = () => {};
    let unsubOnline = () => {};
    let unsubBlocked = () => {};
    
    // Only listen to visitors if logged in as admin via Google
    if (googleUser?.email === "jadedekays@gmail.com") {
      unsubVisitors = onSnapshot(query(collection(db, "visitors"), orderBy("lastSeen", "desc"), limit(50)), (snapshot) => {
        setVisitors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error("AdminTracker Visitors Error:", error);
      });

      unsubOnline = onSnapshot(query(collection(db, "users"), where("isOnline", "==", true)), (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        // Ensure unique numbers
        const uniqueUsers = Array.from(new Set(users.map(u => u.phoneNumber))).map(phone => {
          return users.find(u => u.phoneNumber === phone);
        });
        setOnlineUsersList(uniqueUsers);
      });

      unsubBlocked = onSnapshot(query(collection(db, "users"), where("isBlocked", "==", true)), (snapshot) => {
        setBlockedUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    return () => {
      unsubStats();
      unsubVisitors();
      unsubOnline();
      unsubBlocked();
    };
  }, [googleUser]);

  const handleBlockSubmit = async () => {
    if (!blockNumber) return;
    setIsBlocking(true);
    const cleanPhone = blockNumber.replace(/\D/g, '').slice(-9);
    try {
      await setDoc(doc(db, "users", cleanPhone), {
        isBlocked: true
      }, { merge: true });
      
      await setDoc(doc(db, "stats", "global"), {
        blockedCount: increment(1)
      }, { merge: true });

      setBlockNumber("");
      setShowBlockDialog(false);
      const message = new SpeechSynthesisUtterance("User blocked successfully");
      window.speechSynthesis.speak(message);
    } catch (err) {
      console.error("Block error:", err);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblock = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-9);
    try {
      await setDoc(doc(db, "users", cleanPhone), {
        isBlocked: false
      }, { merge: true });
      
      await setDoc(doc(db, "stats", "global"), {
        blockedCount: increment(-1)
      }, { merge: true });

      const message = new SpeechSynthesisUtterance("User unblocked successfully");
      window.speechSynthesis.speak(message);
    } catch (err) {
      console.error("Unblock error:", err);
    }
  };

  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = v.ip?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         v.device?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'ACTIVE') return v.isOnline;
    if (filter === 'BLOCKED') return v.isBlocked;
    if (filter === 'TODAY') {
        const today = new Date().toDateString();
        const lastSeen = v.lastSeen?.toDate ? v.lastSeen.toDate().toDateString() : new Date(v.lastSeen).toDateString();
        return today === lastSeen;
    }
    return true;
  });

  return (
    <div className="mt-12 space-y-8 p-6 bg-[#050505] border border-cyan-500/10 rounded-3xl">
      {/* Liquid Glass Modals */}
      <LiquidGlassModal 
        isOpen={showOnlineList} 
        onClose={() => setShowOnlineList(false)} 
        title="Online Users"
      >
        <div className="space-y-3">
          {onlineUsersList.length === 0 ? (
            <p className="text-center text-white/40 py-8 text-xs uppercase tracking-widest font-bold">No users online</p>
          ) : (
            onlineUsersList.map((user, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={user.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md group hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                    <Phone className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white tracking-widest">+263 {user.phoneNumber}</p>
                    <p className="text-[8px] uppercase text-green-400 font-bold tracking-tighter">Active Now</p>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              </motion.div>
            ))
          )}
        </div>
      </LiquidGlassModal>

      <LiquidGlassModal 
        isOpen={showBlockDialog} 
        onClose={() => setShowBlockDialog(false)} 
        title="Block Management"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/60 font-black ml-1">Block New Number</label>
              <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input 
                      placeholder="779208037" 
                      value={blockNumber}
                      onChange={(e) => setBlockNumber(e.target.value)}
                      className="bg-white/5 border-white/10 h-12 pl-12 rounded-2xl text-white font-black tracking-widest focus:ring-red-500/50"
                  />
              </div>
            </div>
            <Button 
              onClick={handleBlockSubmit}
              disabled={isBlocking || !blockNumber}
              className="w-full h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              {isBlocking ? "Blocking..." : "Confirm Block"}
            </Button>
            <Button 
              onClick={() => handleUnblock(blockNumber)}
              disabled={isBlocking || !blockNumber}
              variant="outline"
              className="w-full h-10 rounded-2xl border-white/10 bg-white/5 hover:bg-green-500/20 hover:text-green-400 text-white font-black uppercase tracking-widest transition-all active:scale-95 mt-2"
            >
              Unblock Number
            </Button>
          </div>

          <div className="h-[1px] bg-white/10" />

          <div className="space-y-3">
            <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-black ml-1">Blocked Users</h4>
            {blockedUsersList.length === 0 ? (
              <p className="text-center text-white/20 py-4 text-[10px] uppercase tracking-widest font-bold italic">No blocked users</p>
            ) : (
              <div className="space-y-2">
                {blockedUsersList.map((user, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-red-500" />
                      <span className="text-xs font-bold text-white tracking-widest">+263 {user.phoneNumber}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleUnblock(user.phoneNumber)}
                      className="h-6 px-2 text-[7px] font-black uppercase tracking-widest bg-white/5 hover:bg-green-500/20 hover:text-green-400 rounded-md transition-all border border-white/5"
                    >
                      Unblock
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </LiquidGlassModal>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic text-cyan-400">
              USER <span className="text-white">TRACKER</span>
            </h2>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
            ALL VISITORS WHO HAVE ACCESSED THIS SYSTEM
          </p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-cyan-500 font-black">20:45:58</p>
                <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">ADMIN PANEL</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest border-cyan-500/20 hover:bg-cyan-500/10">
                LOGOUT
            </Button>
        </div>
      </div>

      <Button variant="outline" size="sm" className="h-10 px-6 text-[10px] font-black uppercase tracking-widest border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 gap-2">
        <RefreshCcw className="h-3 w-3" />
        REFRESH DATA
      </Button>

      <div className="grid grid-cols-2 gap-6">
        {/* TOTAL */}
        <Card className="bg-black/40 border-cyan-500/30 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500" />
          <CardHeader className="pb-0">
            <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">TOTAL</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-5xl font-black text-white mb-1">{stats.totalVisits}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">TOTAL VISITS</p>
          </CardContent>
        </Card>

        {/* UNIQUE */}
        <Card className="bg-black/40 border-purple-500/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500" />
          <CardHeader className="pb-0">
            <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">UNIQUE</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-5xl font-black text-white mb-1">{stats.uniqueIPs}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">UNIQUE IPS</p>
          </CardContent>
        </Card>

        {/* ONLINE */}
        <Card 
            onClick={() => setShowOnlineList(true)}
            className="bg-black/40 border-green-500/30 relative overflow-hidden cursor-pointer hover:bg-green-500/5 transition-all active:scale-[0.98]"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
          <CardHeader className="pb-0">
            <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">ONLINE</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-5xl font-black text-white mb-1">{stats.onlineUsers}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">ACTIVE NOW</p>
          </CardContent>
        </Card>

        {/* BLOCKED */}
        <Card 
            onClick={() => setShowBlockDialog(true)}
            className="bg-black/40 border-red-500/30 relative overflow-hidden cursor-pointer hover:bg-red-500/5 transition-all active:scale-[0.98]"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
          <CardHeader className="pb-0">
            <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">BLOCKED</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center gap-4">
                <p className="text-5xl font-black text-white mb-1">{stats.blockedUsers}</p>
                <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <ShieldAlert className="h-6 w-6 text-red-500" />
                </div>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">BLOCKED USERS</p>
            
            {blockedUsersList.length > 0 && (
              <div className="space-y-1 border-t border-red-500/10 pt-2">
                {blockedUsersList.slice(0, 3).map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-red-500" />
                    <span className="text-[9px] font-mono text-white/60">+263 {user.phoneNumber}</span>
                  </div>
                ))}
                {blockedUsersList.length > 3 && (
                  <p className="text-[8px] text-muted-foreground italic">+{blockedUsersList.length - 3} more...</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* TODAY */}
        <Card className="bg-black/40 border-yellow-500/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
          <CardHeader className="pb-0">
            <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">TODAY</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-5xl font-black text-white mb-1">{stats.todayVisits}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">VISITS TODAY</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search IP, device, time..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-black/40 border-cyan-500/10 h-12 pl-12 rounded-xl text-xs tracking-widest uppercase font-bold"
          />
        </div>

        <div className="flex gap-2">
          {['ALL', 'ACTIVE', 'BLOCKED', 'TODAY'].map((f) => (
            <Button
              key={f}
              onClick={() => setFilter(f as any)}
              variant={filter === f ? 'default' : 'outline'}
              className={`h-10 px-6 text-[10px] font-black uppercase tracking-widest rounded-lg ${
                filter === f ? 'bg-cyan-500 text-black' : 'border-cyan-500/10 hover:bg-cyan-500/5'
              }`}
            >
              {f}
            </Button>
          ))}
        </div>

        <Card className="bg-black/40 border-cyan-500/10 overflow-hidden">
          <div className="p-4 border-b border-cyan-500/10 flex justify-between items-center bg-cyan-500/5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">VISITOR REGISTRY</h3>
            <span className="text-[10px] text-muted-foreground font-bold">{filteredVisitors.length} RECORDS</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-cyan-500/10 text-[8px] uppercase tracking-widest text-muted-foreground font-black">
                  <th className="p-4">IP ADDRESS</th>
                  <th className="p-4">FIRST SEEN</th>
                  <th className="p-4">LAST SEEN</th>
                  <th className="p-4">STATUS</th>
                </tr>
              </thead>
              <tbody className="text-[10px] font-mono">
                {filteredVisitors.map((v) => (
                  <tr key={v.id} className="border-b border-cyan-500/5 hover:bg-cyan-500/5 transition-colors">
                    <td className="p-4 text-cyan-400 font-bold">{v.ip || '216.234.215.70'}</td>
                    <td className="p-4 text-muted-foreground">{v.firstSeen?.toDate ? v.firstSeen.toDate().toLocaleString() : new Date(v.firstSeen).toLocaleString()}</td>
                    <td className="p-4 text-muted-foreground">{v.lastSeen?.toDate ? v.lastSeen.toDate().toLocaleString() : new Date(v.lastSeen).toLocaleString()}</td>
                    <td className="p-4">
                        <div className={`h-2 w-2 rounded-full ${v.isOnline ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
