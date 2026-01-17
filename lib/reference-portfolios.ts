/**
 * Reference Portfolio Dataset for Wood Wide AI Training
 *
 * This dataset contains synthetic "typical" portfolios that represent
 * different investor profiles. Wood Wide trains on these to detect
 * when a user's portfolio is anomalous compared to normal patterns.
 *
 * Categories:
 * - Conservative: Low risk, dividend focused, diversified
 * - Moderate: Balanced growth and income
 * - Aggressive: High growth, tech heavy
 * - Speculative: Concentrated bets, high volatility
 * - Retirement: Income focused, low volatility
 * - Index-like: Mimics S&P 500 weighting
 */

export interface ReferencePortfolio {
  profile: string;
  description: string;
  risk_score: number; // 1-10
  holdings: {
    ticker: string;
    weight: number; // percentage of portfolio
    sector: string;
  }[];
  metrics: {
    sector_concentration: number; // highest sector weight
    top_holding_weight: number; // largest single position
    num_holdings: number;
    tech_exposure: number;
    dividend_yield_avg: number;
    volatility_profile: "low" | "medium" | "high";
  };
}

export const REFERENCE_PORTFOLIOS: ReferencePortfolio[] = [
  // Conservative Portfolios
  {
    profile: "conservative_dividend",
    description: "Income-focused with blue chip dividend stocks",
    risk_score: 3,
    holdings: [
      { ticker: "JNJ", weight: 12, sector: "Healthcare" },
      { ticker: "PG", weight: 11, sector: "Consumer Staples" },
      { ticker: "KO", weight: 10, sector: "Consumer Staples" },
      { ticker: "VZ", weight: 9, sector: "Communication" },
      { ticker: "PFE", weight: 8, sector: "Healthcare" },
      { ticker: "XOM", weight: 8, sector: "Energy" },
      { ticker: "CVX", weight: 7, sector: "Energy" },
      { ticker: "T", weight: 7, sector: "Communication" },
      { ticker: "MRK", weight: 7, sector: "Healthcare" },
      { ticker: "IBM", weight: 6, sector: "Technology" },
      { ticker: "MMM", weight: 5, sector: "Industrials" },
      { ticker: "CAT", weight: 5, sector: "Industrials" },
      { ticker: "DUK", weight: 5, sector: "Utilities" },
    ],
    metrics: {
      sector_concentration: 27,
      top_holding_weight: 12,
      num_holdings: 13,
      tech_exposure: 6,
      dividend_yield_avg: 3.2,
      volatility_profile: "low",
    },
  },
  {
    profile: "conservative_balanced",
    description: "Mix of stable large caps across sectors",
    risk_score: 3,
    holdings: [
      { ticker: "BRK.B", weight: 10, sector: "Financials" },
      { ticker: "JPM", weight: 9, sector: "Financials" },
      { ticker: "UNH", weight: 9, sector: "Healthcare" },
      { ticker: "JNJ", weight: 8, sector: "Healthcare" },
      { ticker: "PG", weight: 8, sector: "Consumer Staples" },
      { ticker: "WMT", weight: 7, sector: "Consumer Staples" },
      { ticker: "HD", weight: 7, sector: "Consumer Cyclical" },
      { ticker: "COST", weight: 6, sector: "Consumer Staples" },
      { ticker: "LMT", weight: 6, sector: "Industrials" },
      { ticker: "NEE", weight: 5, sector: "Utilities" },
      { ticker: "SO", weight: 5, sector: "Utilities" },
      { ticker: "MSFT", weight: 5, sector: "Technology" },
      { ticker: "AAPL", weight: 5, sector: "Technology" },
      { ticker: "V", weight: 5, sector: "Financials" },
      { ticker: "MA", weight: 5, sector: "Financials" },
    ],
    metrics: {
      sector_concentration: 29,
      top_holding_weight: 10,
      num_holdings: 15,
      tech_exposure: 10,
      dividend_yield_avg: 2.1,
      volatility_profile: "low",
    },
  },

  // Moderate Portfolios
  {
    profile: "moderate_growth",
    description: "Balanced growth with some tech exposure",
    risk_score: 5,
    holdings: [
      { ticker: "AAPL", weight: 12, sector: "Technology" },
      { ticker: "MSFT", weight: 11, sector: "Technology" },
      { ticker: "GOOGL", weight: 8, sector: "Communication" },
      { ticker: "JPM", weight: 7, sector: "Financials" },
      { ticker: "UNH", weight: 7, sector: "Healthcare" },
      { ticker: "V", weight: 6, sector: "Financials" },
      { ticker: "HD", weight: 6, sector: "Consumer Cyclical" },
      { ticker: "PG", weight: 5, sector: "Consumer Staples" },
      { ticker: "JNJ", weight: 5, sector: "Healthcare" },
      { ticker: "COST", weight: 5, sector: "Consumer Staples" },
      { ticker: "LLY", weight: 5, sector: "Healthcare" },
      { ticker: "AMZN", weight: 5, sector: "Consumer Cyclical" },
      { ticker: "MA", weight: 4, sector: "Financials" },
      { ticker: "PEP", weight: 4, sector: "Consumer Staples" },
      { ticker: "ABBV", weight: 5, sector: "Healthcare" },
      { ticker: "MCD", weight: 5, sector: "Consumer Cyclical" },
    ],
    metrics: {
      sector_concentration: 31,
      top_holding_weight: 12,
      num_holdings: 16,
      tech_exposure: 23,
      dividend_yield_avg: 1.8,
      volatility_profile: "medium",
    },
  },
  {
    profile: "moderate_index_like",
    description: "Roughly tracks S&P 500 top holdings",
    risk_score: 5,
    holdings: [
      { ticker: "AAPL", weight: 7, sector: "Technology" },
      { ticker: "MSFT", weight: 7, sector: "Technology" },
      { ticker: "NVDA", weight: 5, sector: "Technology" },
      { ticker: "AMZN", weight: 4, sector: "Consumer Cyclical" },
      { ticker: "GOOGL", weight: 4, sector: "Communication" },
      { ticker: "META", weight: 3, sector: "Communication" },
      { ticker: "BRK.B", weight: 3, sector: "Financials" },
      { ticker: "JPM", weight: 3, sector: "Financials" },
      { ticker: "LLY", weight: 3, sector: "Healthcare" },
      { ticker: "V", weight: 3, sector: "Financials" },
      { ticker: "UNH", weight: 3, sector: "Healthcare" },
      { ticker: "XOM", weight: 3, sector: "Energy" },
      { ticker: "JNJ", weight: 3, sector: "Healthcare" },
      { ticker: "MA", weight: 2, sector: "Financials" },
      { ticker: "PG", weight: 2, sector: "Consumer Staples" },
      { ticker: "HD", weight: 2, sector: "Consumer Cyclical" },
      { ticker: "COST", weight: 2, sector: "Consumer Staples" },
      { ticker: "ABBV", weight: 2, sector: "Healthcare" },
      { ticker: "CVX", weight: 2, sector: "Energy" },
      { ticker: "MRK", weight: 2, sector: "Healthcare" },
    ],
    metrics: {
      sector_concentration: 32,
      top_holding_weight: 7,
      num_holdings: 20,
      tech_exposure: 19,
      dividend_yield_avg: 1.5,
      volatility_profile: "medium",
    },
  },

  // Aggressive Growth Portfolios
  {
    profile: "aggressive_tech",
    description: "Heavy tech/growth concentration",
    risk_score: 8,
    holdings: [
      { ticker: "NVDA", weight: 18, sector: "Technology" },
      { ticker: "AAPL", weight: 15, sector: "Technology" },
      { ticker: "MSFT", weight: 14, sector: "Technology" },
      { ticker: "GOOGL", weight: 10, sector: "Communication" },
      { ticker: "META", weight: 10, sector: "Communication" },
      { ticker: "AMZN", weight: 10, sector: "Consumer Cyclical" },
      { ticker: "TSLA", weight: 8, sector: "Consumer Cyclical" },
      { ticker: "AMD", weight: 5, sector: "Technology" },
      { ticker: "NFLX", weight: 5, sector: "Communication" },
      { ticker: "CRM", weight: 5, sector: "Technology" },
    ],
    metrics: {
      sector_concentration: 57,
      top_holding_weight: 18,
      num_holdings: 10,
      tech_exposure: 57,
      dividend_yield_avg: 0.4,
      volatility_profile: "high",
    },
  },
  {
    profile: "aggressive_mag7",
    description: "Concentrated in Magnificent 7",
    risk_score: 8,
    holdings: [
      { ticker: "NVDA", weight: 20, sector: "Technology" },
      { ticker: "AAPL", weight: 18, sector: "Technology" },
      { ticker: "MSFT", weight: 17, sector: "Technology" },
      { ticker: "GOOGL", weight: 13, sector: "Communication" },
      { ticker: "AMZN", weight: 12, sector: "Consumer Cyclical" },
      { ticker: "META", weight: 12, sector: "Communication" },
      { ticker: "TSLA", weight: 8, sector: "Consumer Cyclical" },
    ],
    metrics: {
      sector_concentration: 55,
      top_holding_weight: 20,
      num_holdings: 7,
      tech_exposure: 55,
      dividend_yield_avg: 0.3,
      volatility_profile: "high",
    },
  },

  // Speculative Portfolios (for comparison - these are risky)
  {
    profile: "speculative_single_stock",
    description: "Dangerously concentrated in one stock",
    risk_score: 10,
    holdings: [
      { ticker: "TSLA", weight: 60, sector: "Consumer Cyclical" },
      { ticker: "NVDA", weight: 20, sector: "Technology" },
      { ticker: "AMD", weight: 10, sector: "Technology" },
      { ticker: "PLTR", weight: 10, sector: "Technology" },
    ],
    metrics: {
      sector_concentration: 40,
      top_holding_weight: 60,
      num_holdings: 4,
      tech_exposure: 40,
      dividend_yield_avg: 0,
      volatility_profile: "high",
    },
  },
  {
    profile: "speculative_meme",
    description: "High-volatility meme/speculative stocks",
    risk_score: 10,
    holdings: [
      { ticker: "GME", weight: 25, sector: "Consumer Cyclical" },
      { ticker: "AMC", weight: 20, sector: "Communication" },
      { ticker: "BBBY", weight: 15, sector: "Consumer Cyclical" },
      { ticker: "PLTR", weight: 15, sector: "Technology" },
      { ticker: "SOFI", weight: 15, sector: "Financials" },
      { ticker: "RIVN", weight: 10, sector: "Consumer Cyclical" },
    ],
    metrics: {
      sector_concentration: 50,
      top_holding_weight: 25,
      num_holdings: 6,
      tech_exposure: 15,
      dividend_yield_avg: 0,
      volatility_profile: "high",
    },
  },
  {
    profile: "speculative_crypto_adjacent",
    description: "Bitcoin and crypto-related stocks",
    risk_score: 10,
    holdings: [
      { ticker: "MSTR", weight: 30, sector: "Technology" },
      { ticker: "COIN", weight: 25, sector: "Financials" },
      { ticker: "MARA", weight: 15, sector: "Financials" },
      { ticker: "RIOT", weight: 15, sector: "Financials" },
      { ticker: "SQ", weight: 10, sector: "Technology" },
      { ticker: "HOOD", weight: 5, sector: "Financials" },
    ],
    metrics: {
      sector_concentration: 55,
      top_holding_weight: 30,
      num_holdings: 6,
      tech_exposure: 40,
      dividend_yield_avg: 0,
      volatility_profile: "high",
    },
  },

  // Retirement/Income Portfolios
  {
    profile: "retirement_income",
    description: "High dividend yield for income generation",
    risk_score: 2,
    holdings: [
      { ticker: "O", weight: 10, sector: "Real Estate" },
      { ticker: "VZ", weight: 9, sector: "Communication" },
      { ticker: "T", weight: 9, sector: "Communication" },
      { ticker: "MO", weight: 8, sector: "Consumer Staples" },
      { ticker: "PM", weight: 8, sector: "Consumer Staples" },
      { ticker: "XOM", weight: 7, sector: "Energy" },
      { ticker: "CVX", weight: 7, sector: "Energy" },
      { ticker: "KO", weight: 6, sector: "Consumer Staples" },
      { ticker: "PEP", weight: 6, sector: "Consumer Staples" },
      { ticker: "DUK", weight: 5, sector: "Utilities" },
      { ticker: "SO", weight: 5, sector: "Utilities" },
      { ticker: "ED", weight: 5, sector: "Utilities" },
      { ticker: "ABBV", weight: 5, sector: "Healthcare" },
      { ticker: "PFE", weight: 5, sector: "Healthcare" },
      { ticker: "IBM", weight: 5, sector: "Technology" },
    ],
    metrics: {
      sector_concentration: 28,
      top_holding_weight: 10,
      num_holdings: 15,
      tech_exposure: 5,
      dividend_yield_avg: 4.5,
      volatility_profile: "low",
    },
  },

  // Sector-Specific Portfolios (for pattern matching)
  {
    profile: "sector_healthcare",
    description: "Healthcare sector focused",
    risk_score: 6,
    holdings: [
      { ticker: "UNH", weight: 18, sector: "Healthcare" },
      { ticker: "LLY", weight: 16, sector: "Healthcare" },
      { ticker: "JNJ", weight: 14, sector: "Healthcare" },
      { ticker: "ABBV", weight: 12, sector: "Healthcare" },
      { ticker: "MRK", weight: 10, sector: "Healthcare" },
      { ticker: "PFE", weight: 8, sector: "Healthcare" },
      { ticker: "TMO", weight: 7, sector: "Healthcare" },
      { ticker: "ABT", weight: 7, sector: "Healthcare" },
      { ticker: "DHR", weight: 5, sector: "Healthcare" },
      { ticker: "BMY", weight: 3, sector: "Healthcare" },
    ],
    metrics: {
      sector_concentration: 100,
      top_holding_weight: 18,
      num_holdings: 10,
      tech_exposure: 0,
      dividend_yield_avg: 1.8,
      volatility_profile: "medium",
    },
  },
  {
    profile: "sector_financials",
    description: "Financial sector focused",
    risk_score: 6,
    holdings: [
      { ticker: "JPM", weight: 18, sector: "Financials" },
      { ticker: "BAC", weight: 14, sector: "Financials" },
      { ticker: "WFC", weight: 12, sector: "Financials" },
      { ticker: "GS", weight: 10, sector: "Financials" },
      { ticker: "MS", weight: 10, sector: "Financials" },
      { ticker: "BLK", weight: 8, sector: "Financials" },
      { ticker: "C", weight: 8, sector: "Financials" },
      { ticker: "SCHW", weight: 7, sector: "Financials" },
      { ticker: "AXP", weight: 7, sector: "Financials" },
      { ticker: "USB", weight: 6, sector: "Financials" },
    ],
    metrics: {
      sector_concentration: 100,
      top_holding_weight: 18,
      num_holdings: 10,
      tech_exposure: 0,
      dividend_yield_avg: 2.5,
      volatility_profile: "medium",
    },
  },
  {
    profile: "sector_energy",
    description: "Energy sector focused",
    risk_score: 7,
    holdings: [
      { ticker: "XOM", weight: 22, sector: "Energy" },
      { ticker: "CVX", weight: 18, sector: "Energy" },
      { ticker: "COP", weight: 12, sector: "Energy" },
      { ticker: "SLB", weight: 10, sector: "Energy" },
      { ticker: "EOG", weight: 10, sector: "Energy" },
      { ticker: "PXD", weight: 8, sector: "Energy" },
      { ticker: "OXY", weight: 7, sector: "Energy" },
      { ticker: "DVN", weight: 7, sector: "Energy" },
      { ticker: "HAL", weight: 6, sector: "Energy" },
    ],
    metrics: {
      sector_concentration: 100,
      top_holding_weight: 22,
      num_holdings: 9,
      tech_exposure: 0,
      dividend_yield_avg: 3.2,
      volatility_profile: "high",
    },
  },
];

/**
 * Convert reference portfolios to a flat CSV-like format for Wood Wide training
 */
export function getReferenceDataForTraining(): {
  ticker: string;
  weight: number;
  sector: string;
  profile: string;
  risk_score: number;
  sector_concentration: number;
  top_holding_weight: number;
  num_holdings: number;
  tech_exposure: number;
  volatility: number; // 1=low, 2=medium, 3=high
}[] {
  const rows: ReturnType<typeof getReferenceDataForTraining> = [];

  for (const portfolio of REFERENCE_PORTFOLIOS) {
    const volatilityNum =
      portfolio.metrics.volatility_profile === "low" ? 1 :
      portfolio.metrics.volatility_profile === "medium" ? 2 : 3;

    for (const holding of portfolio.holdings) {
      rows.push({
        ticker: holding.ticker,
        weight: holding.weight,
        sector: holding.sector,
        profile: portfolio.profile,
        risk_score: portfolio.risk_score,
        sector_concentration: portfolio.metrics.sector_concentration,
        top_holding_weight: portfolio.metrics.top_holding_weight,
        num_holdings: portfolio.metrics.num_holdings,
        tech_exposure: portfolio.metrics.tech_exposure,
        volatility: volatilityNum,
      });
    }
  }

  return rows;
}

/**
 * Get portfolio metrics summary for comparison
 */
export function getPortfolioMetricsBenchmarks() {
  const allMetrics = REFERENCE_PORTFOLIOS.map(p => p.metrics);

  return {
    sector_concentration: {
      conservative: { min: 25, max: 35 },
      moderate: { min: 30, max: 40 },
      aggressive: { min: 40, max: 60 },
      speculative: { min: 40, max: 100 },
    },
    top_holding_weight: {
      conservative: { min: 5, max: 12 },
      moderate: { min: 7, max: 15 },
      aggressive: { min: 15, max: 25 },
      speculative: { min: 25, max: 70 },
    },
    num_holdings: {
      conservative: { min: 12, max: 20 },
      moderate: { min: 10, max: 20 },
      aggressive: { min: 7, max: 12 },
      speculative: { min: 3, max: 8 },
    },
    tech_exposure: {
      conservative: { min: 0, max: 15 },
      moderate: { min: 15, max: 30 },
      aggressive: { min: 40, max: 70 },
    },
  };
}

/**
 * Classify a user's portfolio based on metrics
 */
export function classifyPortfolio(metrics: {
  sector_concentration: number;
  top_holding_weight: number;
  num_holdings: number;
  tech_exposure: number;
}): {
  profile: "conservative" | "moderate" | "aggressive" | "speculative";
  confidence: number;
  similar_to: string[];
  warnings: string[];
} {
  const benchmarks = getPortfolioMetricsBenchmarks();
  let score = 0;
  const warnings: string[] = [];
  const similar: string[] = [];

  // Score based on concentration
  if (metrics.top_holding_weight > 50) {
    score += 4;
    warnings.push("Extremely concentrated in a single position");
  } else if (metrics.top_holding_weight > 30) {
    score += 3;
    warnings.push("High single-stock concentration");
  } else if (metrics.top_holding_weight > 20) {
    score += 2;
  } else if (metrics.top_holding_weight > 12) {
    score += 1;
  }

  // Score based on sector concentration
  if (metrics.sector_concentration > 70) {
    score += 3;
    warnings.push("Heavily concentrated in one sector");
  } else if (metrics.sector_concentration > 50) {
    score += 2;
  } else if (metrics.sector_concentration > 35) {
    score += 1;
  }

  // Score based on number of holdings (fewer = riskier)
  if (metrics.num_holdings < 5) {
    score += 3;
    warnings.push("Very few holdings increases idiosyncratic risk");
  } else if (metrics.num_holdings < 8) {
    score += 2;
  } else if (metrics.num_holdings < 12) {
    score += 1;
  }

  // Score based on tech exposure
  if (metrics.tech_exposure > 60) {
    score += 2;
    warnings.push("Heavy technology sector exposure");
  } else if (metrics.tech_exposure > 40) {
    score += 1;
  }

  // Find similar reference portfolios
  for (const ref of REFERENCE_PORTFOLIOS) {
    const sectorDiff = Math.abs(ref.metrics.sector_concentration - metrics.sector_concentration);
    const holdingDiff = Math.abs(ref.metrics.top_holding_weight - metrics.top_holding_weight);
    const numDiff = Math.abs(ref.metrics.num_holdings - metrics.num_holdings);

    if (sectorDiff < 15 && holdingDiff < 10 && numDiff < 5) {
      similar.push(ref.profile);
    }
  }

  // Classify based on score
  let profile: "conservative" | "moderate" | "aggressive" | "speculative";
  let confidence: number;

  if (score >= 8) {
    profile = "speculative";
    confidence = Math.min(95, 70 + score * 2);
  } else if (score >= 5) {
    profile = "aggressive";
    confidence = Math.min(90, 65 + score * 3);
  } else if (score >= 2) {
    profile = "moderate";
    confidence = Math.min(85, 60 + score * 5);
  } else {
    profile = "conservative";
    confidence = Math.min(90, 75 + (3 - score) * 5);
  }

  return {
    profile,
    confidence,
    similar_to: similar.slice(0, 3),
    warnings,
  };
}
