import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Copy, ExternalLink, Share2 } from "lucide-react";
import { useState } from "react";

export function AppLink() {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-accent/10 border-accent/20">
      <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-full">
            <Share2 className="h-4 w-4 text-accent-foreground" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Direct Bot Link</p>
            <p className="text-sm font-mono truncate max-w-[200px] md:max-w-xs opacity-70">{url}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" className="flex-1 md:flex-none gap-2" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "sm" }), "flex-1 md:flex-none gap-2")}
          >
            <ExternalLink className="h-4 w-4" />
            Open Full
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
