import * as React from "react";
import { useState, useRef } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlus, Loader2, Scan, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ImageAnalyzerProps {
  onDataExtracted: (multipliers: number[]) => void;
}

export function ImageAnalyzer({ onDataExtracted }: ImageAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please upload a valid image file.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const base64Data = await fileToBase64(file);
      const multipliers = await analyzeImage(base64Data, file.type);
      
      if (multipliers.length > 0) {
        onDataExtracted(multipliers);
      } else {
        setError("Could not find any multipliers in the image. Please try a clearer screenshot.");
      }
    } catch (err) {
      console.error("Image analysis failed:", err);
      setError("Failed to analyze image. Please check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const analyzeImage = async (base64Data: string, mimeType: string): Promise<number[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `Analyze this Aviator game screenshot. 
    1. Identify the round history section (usually a list of multipliers like 1.23x, 5.00x, 10.5x).
    2. Extract all multiplier values as numbers.
    3. Return ONLY a JSON array of these numbers.
    4. Order them from OLDEST to NEWEST (left-to-right or top-to-bottom in the history bar).
    
    Example output: [1.2, 5.43, 10.2, 1.0, 2.34]`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.NUMBER }
        }
      }
    });

    try {
      const text = response.text;
      const multipliers = JSON.parse(text);
      if (Array.isArray(multipliers) && multipliers.length > 0) {
        const message = new SpeechSynthesisUtterance("History scanned successfully");
        message.rate = 1;
        message.pitch = 1;
        window.speechSynthesis.speak(message);
      }
      return multipliers;
    } catch (e) {
      console.error("Failed to parse Gemini response:", e);
      return [];
    }
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            Visual History Scanner
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-widest">AI Powered</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Upload a screenshot of your Aviator round history (the bar at the top or the detailed list). Our AI will extract the multipliers to improve the prediction accuracy.
        </p>

        <div className="relative">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isAnalyzing}
          />
          <Button 
            className="w-full h-24 border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all flex flex-col gap-2"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Analyzing Screenshot...</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-primary/60" />
                <span className="text-xs font-bold uppercase tracking-widest">Upload History Screenshot</span>
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Pro Tip</p>
          <p className="text-[10px] leading-relaxed opacity-70">
            For best results, ensure the screenshot clearly shows the top history bar or the detailed round list.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
