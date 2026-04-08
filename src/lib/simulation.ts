import { Round, SimulationResult, StrategyConfig } from '../types';

export function runSimulation(
  initialBalance: number,
  roundsCount: number,
  config: StrategyConfig,
  historicalData?: Round[]
): SimulationResult {
  let balance = initialBalance;
  let currentBet = config.baseBet;
  let wins = 0;
  let totalBet = 0;
  let maxDrawdown = 0;
  let peak = initialBalance;
  const profitHistory: { round: number; balance: number }[] = [{ round: 0, balance }];

  for (let i = 0; i < roundsCount; i++) {
    // If we run out of money, stop
    if (balance < currentBet) break;

    const multiplier = historicalData && historicalData[i] 
      ? historicalData[i].multiplier 
      : generateRandomMultiplier();

    totalBet += currentBet;
    balance -= currentBet;

    if (multiplier >= config.targetMultiplier) {
      // Win
      const winAmount = currentBet * config.targetMultiplier;
      balance += winAmount;
      wins++;
      
      // Reset bet for Martingale
      if (config.type === 'martingale') {
        currentBet = config.baseBet;
      }
    } else {
      // Loss
      if (config.type === 'martingale') {
        currentBet *= (config.martingaleMultiplier || 2);
        if (config.maxBet && currentBet > config.maxBet) {
          currentBet = config.maxBet;
        }
      }
    }

    // Track peak and drawdown
    if (balance > peak) peak = balance;
    const drawdown = peak - balance;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;

    profitHistory.push({ round: i + 1, balance });
  }

  return {
    rounds: profitHistory.length - 1,
    finalBalance: balance,
    maxDrawdown,
    winRate: (wins / (profitHistory.length - 1)) * 100,
    profitHistory,
    totalBet,
    totalProfit: balance - initialBalance,
  };
}

// Crash games typically follow a power law distribution
// P(X > x) = 0.99 / x
// This means 1% house edge (instant crash at 1.00x)
export function generateRandomMultiplier(): number {
  const r = Math.random();
  if (r < 0.01) return 1.00; // Instant crash
  return Math.floor(99 / (1 - r)) / 100;
}

export function generateSampleData(count: number): Round[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `round-${i}`,
    multiplier: generateRandomMultiplier(),
    timestamp: Date.now() - (count - i) * 10000,
  }));
}

export function generateScannedData(site: number): Round[] {
  // Simulate scanning 50 rounds from a site
  return Array.from({ length: 50 }, (_, i) => ({
    id: `scanned-${Date.now()}-${i}`,
    multiplier: generateRandomMultiplier(),
    timestamp: Date.now() - (50 - i) * 15000,
  }));
}
