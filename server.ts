import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use(express.json());

  // EcoCash Payment Initiation
  app.post("/api/ecocash/initiate", async (req, res) => {
    const { phoneNumber, amount, currency } = req.body;

    // In a real implementation, you would call the EcoCash API or a gateway like Paynow here.
    // Example:
    // const response = await fetch('https://api.ecocash.co.zw/v1/payment/initiate', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.ECOCASH_INTEGRATION_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     merchant_number: process.env.ECOCASH_MERCHANT_NUMBER,
    //     customer_number: phoneNumber,
    //     amount: amount,
    //     currency: currency, // USD or ZIG
    //     reference: `CRASH-${Date.now()}`
    //   })
    // });
    
    console.log(`Initiating EcoCash payment for ${phoneNumber}: ${amount} ${currency}`);
    
    // Simulating a successful initiation that triggers a USSD push
    res.json({ 
      success: true, 
      message: "USSD push sent to your phone. Please enter your PIN to approve.",
      pollUrl: "/api/ecocash/status" 
    });
  });

  // EcoCash Payment Status Check
  app.get("/api/ecocash/status", (req, res) => {
    // In a real implementation, you would check the status with the gateway
    res.json({ status: "pending" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
