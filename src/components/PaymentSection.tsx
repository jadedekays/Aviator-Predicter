import * as React from "react";
import { useState } from "react";
import { CreditCard, ArrowRight, CheckCircle2, AlertCircle, DollarSign, Wallet, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

interface PaymentSectionProps {
  userPhone: string;
}

export function PaymentSection({ userPhone }: PaymentSectionProps) {
  const [step, setStep] = useState<'initial' | 'details'>('initial');
  const [currency, setCurrency] = useState<'USD' | 'ZIG'>('USD');
  const [amount, setAmount] = useState("5");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Conversion rate (Example: 1 USD = 14 ZiG)
  const ZIG_RATE = 14;

  const handleCurrencyChange = (newCurrency: 'USD' | 'ZIG') => {
    setCurrency(newCurrency);
    if (newCurrency === 'USD') {
      setAmount("5");
    } else {
      setAmount((5 * ZIG_RATE).toString());
    }
  };

  const handleInitiate = async () => {
    const requiredAmount = currency === 'USD' ? "5" : (5 * ZIG_RATE).toString();
    if (amount !== requiredAmount) return;
    
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Set pending status in Firestore
      await updateDoc(doc(db, "users", userPhone), {
        isPendingApproval: true
      });

      // Lead user straight to WhatsApp with approval link
      const approvalLink = `${window.location.origin}?approve=${userPhone}`;
      const message = encodeURIComponent(`Hello, I want to make a payment of ${currency} ${amount} for premium signals. My phone number is +263${userPhone}. Approve me here: ${approvalLink}`);
      const whatsappUrl = `https://wa.me/263779208037?text=${message}`;
      
      window.open(whatsappUrl, '_blank');
      setIsProcessing(false);
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setPaymentError("Failed to initiate payment. Please try again.");
      setIsProcessing(false);
    }
  };

  if (showSuccess) {
    return (
      <Card id="payment-section" className="bg-green-500/5 border-green-500/20 max-w-2xl mx-auto overflow-hidden">
        <CardContent className="pt-12 pb-12 text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter">Payment Initialized</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Please complete your EcoCash transfer of <span className="text-foreground font-bold">{currency === 'USD' ? '$' : 'ZiG '}{amount}</span> to 
            <span className="text-primary font-bold ml-1">+263779208037</span>. 
            Your premium signals will be activated once the transaction is verified by the service provider.
          </p>
          <Button variant="outline" onClick={() => { setShowSuccess(false); setStep('initial'); }} className="mt-4">
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card id="payment-section" className="bg-card/50 border-primary/20 shadow-2xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Wallet className="h-32 w-32 -rotate-12" />
      </div>

      {step === 'initial' ? (
        <div className="p-8 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em] border-primary/30 text-primary">
              Premium Access
            </Badge>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
              Unlock <span className="text-primary">Elite</span> Signals
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Get access to high-accuracy predictions and advanced strategy algorithms.
            </p>
          </div>

          <Button 
            onClick={() => setStep('details')}
            className="w-full h-16 text-lg font-black uppercase italic tracking-tight gap-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] group"
          >
            PURCHASE NOW
            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <div className="flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-green-500" /> Secure Payment</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="flex items-center gap-1"><CreditCard className="h-3 w-3 text-blue-500" /> EcoCash Supported</span>
          </div>
        </div>
      ) : (
        <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <CardHeader className="p-0 space-y-1">
            <CardTitle className="text-xl font-black uppercase italic tracking-tight">Complete Purchase</CardTitle>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Step 2: Payment Verification</p>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recipient</span>
                <span className="text-sm font-mono font-bold">+263779208037</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Method</span>
                <Badge className="bg-blue-500 hover:bg-blue-600">EcoCash</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1 flex items-center gap-1">
                Select Wallet Currency
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={currency === 'USD' ? 'default' : 'outline'}
                  onClick={() => handleCurrencyChange('USD')}
                  className="h-10 text-[10px] uppercase font-bold tracking-widest"
                >
                  USD Wallet
                </Button>
                <Button 
                  variant={currency === 'ZIG' ? 'default' : 'outline'}
                  onClick={() => handleCurrencyChange('ZIG')}
                  className="h-10 text-[10px] uppercase font-bold tracking-widest"
                >
                  ZiG Wallet
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Amount to be paid ({currency})
              </label>
              <div className="relative">
                <Input 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-background/50 h-12 font-mono text-lg pl-8"
                  placeholder={currency === 'USD' ? "5" : (5 * ZIG_RATE).toString()}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                  {currency === 'USD' ? '$' : 'ZiG'}
                </span>
              </div>
              {((currency === 'USD' && amount !== "5") || (currency === 'ZIG' && amount !== (5 * ZIG_RATE).toString())) && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> 
                  Only {currency === 'USD' ? '$5' : `ZiG ${5 * ZIG_RATE}`} payments are accepted
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-0 flex flex-col gap-3">
            <Button 
              onClick={handleInitiate}
              disabled={((currency === 'USD' && amount !== "5") || (currency === 'ZIG' && amount !== (5 * ZIG_RATE).toString())) || isProcessing}
              className="w-full h-14 font-black uppercase tracking-widest text-sm gap-2"
            >
              {isProcessing ? "Opening WhatsApp..." : "Purchase Now"}
              {!isProcessing && <ArrowRight className="h-4 w-4" />}
            </Button>
            <button 
              onClick={() => setStep('initial')}
              className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              Cancel and go back
            </button>
          </CardFooter>
        </div>
      )}
    </Card>
    <div className="mt-4 text-center">
      <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em] animate-pulse">
        NB : INFORM THE SERVICE PROVIDER FIRST BEFORE MAKING A PAYMENT
      </p>
    </div>
    </>
  );
}
