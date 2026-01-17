/**
 * Risk Factor Database for Wood Wide AI-style Portfolio Analysis
 *
 * Focus on SPECIFIC, NON-OBVIOUS risks that users wouldn't immediately think of.
 * Avoid generic risks like "recession" that affect everything.
 */

export interface RiskFactor {
  id: string;
  name: string;
  category:
    | "concentration"
    | "geopolitical"
    | "regulatory"
    | "event"
    | "correlation";
  description: string;
  triggers: {
    tickers?: string[];
    sectors?: string[];
    industries?: string[];
    keywords?: string[];
  };
  severityCalc: "exposure_pct" | "count" | "concentration";
  thresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  impact: string;
  recommendation: string;
  hedgeKeywords: string[];
}

export const RISK_FACTORS: RiskFactor[] = [
  // ============================================================================
  // CONCENTRATION RISKS - These are always relevant
  // ============================================================================
  {
    id: "single_stock_concentration",
    name: "Single Stock Risk",
    category: "concentration",
    description: "One position dominates your portfolio",
    triggers: {},
    severityCalc: "concentration",
    thresholds: { low: 20, medium: 30, high: 40, critical: 55 },
    impact:
      "A single earnings miss, lawsuit, or executive departure could cause outsized losses.",
    recommendation:
      "Consider trimming to below 15% of portfolio or hedging with put options.",
    hedgeKeywords: [],
  },
  {
    id: "sector_concentration",
    name: "Sector Concentration",
    category: "concentration",
    description: "Portfolio heavily weighted in one sector",
    triggers: {},
    severityCalc: "concentration",
    thresholds: { low: 40, medium: 55, high: 70, critical: 85 },
    impact:
      "Sector-specific regulation, demand shifts, or input cost changes hit your whole portfolio.",
    recommendation: "Diversify across 3-4 sectors to reduce correlation.",
    hedgeKeywords: [],
  },

  // ============================================================================
  // SPECIFIC GEOPOLITICAL RISKS - Tied to real current events
  // ============================================================================
  {
    id: "china_tariff_exposure",
    name: "China Tariff Exposure",
    category: "geopolitical",
    description: "Companies with China manufacturing that face tariff risk",
    triggers: {
      tickers: [
        "AAPL",
        "NVDA",
        "TSLA",
        "QCOM",
        "AMD",
        "MU",
        "AVGO",
        "NKE",
        "SBUX",
        "LULU",
      ],
    },
    severityCalc: "exposure_pct",
    thresholds: { low: 15, medium: 30, high: 45, critical: 60 },
    impact:
      "New tariffs could add 10-25% to product costs. Apple assembles 95% of iPhones in China. Nike sources 25% from China.",
    recommendation:
      "Polymarket has active tariff markets. Consider YES on higher tariff brackets if exposed.",
    hedgeKeywords: ["china", "tariff", "trade"],
  },
  {
    id: "taiwan_chip_dependency",
    name: "TSMC Dependency",
    category: "geopolitical",
    description: "Companies reliant on Taiwan Semiconductor Manufacturing",
    triggers: {
      tickers: ["NVDA", "AMD", "AAPL", "QCOM", "AVGO", "MRVL", "INTC"],
    },
    severityCalc: "exposure_pct",
    thresholds: { low: 15, medium: 30, high: 50, critical: 70 },
    impact:
      "TSMC makes 90% of advanced chips. NVDA and AMD are 100% dependent on TSMC for cutting-edge GPUs. Any Taiwan Strait disruption halts production.",
    recommendation:
      "Watch China-Taiwan tensions. Intel is building US fabs but years away.",
    hedgeKeywords: ["taiwan", "china", "TSMC", "invasion"],
  },

  // ============================================================================
  // SPECIFIC REGULATORY RISKS - Active cases and legislation
  // ============================================================================
  {
    id: "google_antitrust",
    name: "Google Antitrust Ruling",
    category: "regulatory",
    description: "DOJ won its antitrust case - remedies pending",
    triggers: {
      tickers: ["GOOGL", "GOOG"],
    },
    severityCalc: "exposure_pct",
    thresholds: { low: 5, medium: 12, high: 20, critical: 30 },
    impact:
      "Judge ruled Google is an illegal monopoly. Remedies could include selling Chrome, ending Apple search deal ($20B/year revenue), or breaking up the company.",
    recommendation:
      "Ruling happened in 2024. Remedy phase in 2025. High uncertainty on outcome.",
    hedgeKeywords: ["google", "antitrust", "DOJ", "breakup", "Chrome"],
  },
  {
    id: "meta_ftc_case",
    name: "Meta FTC Lawsuit",
    category: "regulatory",
    description: "FTC seeking to unwind Instagram and WhatsApp acquisitions",
    triggers: {
      tickers: ["META"],
    },
    severityCalc: "exposure_pct",
    thresholds: { low: 5, medium: 12, high: 20, critical: 30 },
    impact:
      "FTC wants Meta to divest Instagram and WhatsApp. Case ongoing since 2020. A forced divestiture would dramatically change the company.",
    recommendation:
      "Trial ongoing. Low probability of full breakup but creates headline risk.",
    hedgeKeywords: ["meta", "facebook", "instagram", "FTC", "antitrust"],
  },
  {
    id: "ai_chip_export_controls",
    name: "AI Chip Export Bans",
    category: "regulatory",
    description: "US restricting AI chip sales to China",
    triggers: {
      tickers: ["NVDA", "AMD", "INTC", "AVGO", "QCOM"],
    },
    severityCalc: "exposure_pct",
    thresholds: { low: 10, medium: 25, high: 40, critical: 55 },
    impact:
      "NVDA lost ~$5B/quarter in China revenue from export controls. Each new restriction announcement hits the stock 5-10%.",
    recommendation:
      "Watch for new export control announcements. NVDA has designed 'compliant' chips but rules keep tightening.",
    hedgeKeywords: ["nvidia", "china", "export", "chip", "AI"],
  },
  {
    id: "tiktok_ban_impact",
    name: "TikTok Ban Spillover",
    category: "regulatory",
    description: "Companies affected by potential TikTok ban/sale",
    triggers: {
      tickers: ["META", "SNAP", "GOOGL", "GOOG", "PINS"],
    },
    severityCalc: "exposure_pct",
    thresholds: { low: 10, medium: 20, high: 35, critical: 50 },
    impact:
      "If TikTok is banned, META and SNAP are biggest beneficiaries (Reels, Spotlight). Could see 10-20% ad revenue boost.",
    recommendation:
      "This is actually a POSITIVE catalyst. Consider this when sizing positions.",
    hedgeKeywords: ["tiktok", "ban", "bytedance", "social media"],
  },

  // ============================================================================
  // EVENT-DRIVEN RISKS - Specific upcoming catalysts
  // ============================================================================
  {
    id: "musk_twitter_distraction",
    name: "Musk Attention Risk",
    category: "event",
    description: "Tesla exposure while Musk runs multiple companies",
    triggers: {
      tickers: ["TSLA"],
    },
    severityCalc: "exposure_pct",
    thresholds: { low: 8, medium: 15, high: 25, critical: 40 },
    impact:
      "Musk runs Tesla, SpaceX, X, xAI, Neuralink, and Boring Company. Tesla investors worry about divided attention. His political involvement creates brand risk.",
    recommendation:
      "Tesla trades on Musk sentiment. Watch his X posts and political statements.",
    hedgeKeywords: ["musk", "tesla", "twitter", "doge"],
  },
  {
    id: "nvidia_earnings_concentration",
    name: "NVDA Earnings Binary Event",
    category: "event",
    description: "Portfolio exposed to NVIDIA earnings volatility",
    triggers: {
      tickers: ["NVDA"],
    },
    severityCalc: "exposure_pct",
    thresholds: { low: 8, medium: 15, high: 25, critical: 40 },
    impact:
      "NVDA moves 8-15% on earnings. With its market cap, it can move the entire S&P 500. Your portfolio has concentrated exposure to this single event.",
    recommendation:
      "Consider reducing position before earnings or hedging with options.",
    hedgeKeywords: ["nvidia", "earnings", "AI", "data center"],
  },
  {
    id: "weight_loss_drug_competition",
    name: "GLP-1 Drug Competition",
    category: "event",
    description: "Exposure to weight-loss drug market dynamics",
    triggers: {
      tickers: ["LLY", "NVO", "AMGN", "PFE", "VKTX"],
    },
    severityCalc: "exposure_pct",
    thresholds: { low: 10, medium: 20, high: 35, critical: 50 },
    impact:
      "GLP-1 market is $50B+ and growing. LLY and NVO dominate but new entrants (oral pills, competitors) could disrupt. Each clinical trial readout moves stocks 10-20%.",
    recommendation:
      "Watch FDA approval dates and clinical trial results. High binary risk.",
    hedgeKeywords: ["ozempic", "wegovy", "mounjaro", "weight loss", "GLP-1"],
  },

  // ============================================================================
  // HIDDEN CORRELATION RISKS - Things that move together unexpectedly
  // ============================================================================
  {
    id: "mag7_correlation",
    name: "Magnificent 7 Correlation",
    category: "correlation",
    description: "Stocks that trade together despite different businesses",
    triggers: {
      tickers: [
        "AAPL",
        "MSFT",
        "GOOGL",
        "GOOG",
        "AMZN",
        "META",
        "NVDA",
        "TSLA",
      ],
    },
    severityCalc: "exposure_pct",
    thresholds: { low: 25, medium: 40, high: 60, critical: 75 },
    impact:
      "These stocks are 30% of the S&P 500 and trade as a group. When one sells off, they all do. Correlation is ~0.7 during selloffs.",
    recommendation:
      "You're not diversified just because you own different Mag 7 names. Consider non-tech exposure.",
    hedgeKeywords: ["magnificent 7", "tech", "nasdaq", "S&P"],
  },
  {
    id: "bitcoin_proxy_stocks",
    name: "Hidden Bitcoin Exposure",
    category: "correlation",
    description: "Stocks that move with Bitcoin price",
    triggers: {
      tickers: ["COIN", "MSTR", "SQ", "PYPL", "HOOD", "MARA", "RIOT", "CLSK"],
    },
    severityCalc: "exposure_pct",
    thresholds: { low: 8, medium: 18, high: 30, critical: 45 },
    impact:
      "MSTR is basically a Bitcoin ETF (holds 200K+ BTC). COIN revenue is 80% correlated to crypto prices. These stocks can drop 30%+ when Bitcoin crashes.",
    recommendation:
      "If you want Bitcoin exposure, consider buying Bitcoin directly. If you don't, reduce these positions.",
    hedgeKeywords: ["bitcoin", "crypto", "BTC"],
  },
  {
    id: "interest_rate_growth_stocks",
    name: "Rate-Sensitive Growth Stocks",
    category: "correlation",
    description: "High-multiple stocks that sell off when rates rise",
    triggers: {
      tickers: [
        "TSLA",
        "SNOW",
        "PLTR",
        "NET",
        "DDOG",
        "CRWD",
        "ZS",
        "SHOP",
        "SQ",
      ],
    },
    severityCalc: "exposure_pct",
    thresholds: { low: 15, medium: 30, high: 45, critical: 60 },
    impact:
      "These trade at 10-30x revenue. When 10-year yields spike, they sell off together. Dec 2022 saw 50%+ drawdowns across the group.",
    recommendation:
      "Monitor Fed announcements and 10-year Treasury yields. These are effectively a rates bet.",
    hedgeKeywords: [
      "federal reserve",
      "interest rate",
      "rate cut",
      "rate hike",
      "Powell",
    ],
  },
];

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface RiskAlert {
  riskFactor: RiskFactor;
  severity: SeverityLevel;
  severityScore: number;
  exposurePercent: number;
  affectedTickers: string[];
  affectedValue: number;
  hedgeKeywords: string[];
}

export function getSeverityLevel(
  score: number,
  thresholds: RiskFactor["thresholds"],
): SeverityLevel {
  if (score >= thresholds.critical) return "critical";
  if (score >= thresholds.high) return "high";
  if (score >= thresholds.medium) return "medium";
  if (score >= thresholds.low) return "low";
  return "low";
}

export function getSeverityColor(severity: SeverityLevel): string {
  switch (severity) {
    case "critical":
      return "red";
    case "high":
      return "orange";
    case "medium":
      return "yellow";
    case "low":
      return "green";
  }
}
