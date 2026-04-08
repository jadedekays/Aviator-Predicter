import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export function SafetyWarning() {
  return (
    <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive-foreground">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle className="font-bold">Important Disclaimer</AlertTitle>
      <AlertDescription className="text-sm opacity-90">
        This tool is for <strong>educational and simulation purposes only</strong>. It does NOT predict future outcomes of any game. 
        Crash games are based on random number generation with a house edge. Never bet more than you can afford to lose.
      </AlertDescription>
    </Alert>
  );
}
