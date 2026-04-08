export interface Round {
  id: string;
  multiplier: number;
  timestamp: number;
}

export interface SimulationResult {
  rounds: number;
  finalBalance: number;
  maxDrawdown: number;
  winRate: number;
  profitHistory: { round: number; balance: number }[];
  totalBet: number;
  totalProfit: number;
}

export type StrategyType = 'fixed' | 'martingale' | 'auto-cashout';

export interface StrategyConfig {
  type: StrategyType;
  baseBet: number;
  targetMultiplier: number;
  martingaleMultiplier?: number;
  maxBet?: number;
}
