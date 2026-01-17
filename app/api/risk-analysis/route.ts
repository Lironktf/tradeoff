import { NextRequest, NextResponse } from "next/server";
import { getStockData } from "@/lib/stocks";
import {
  RISK_FACTORS,
  RiskFactor,
  RiskAlert,
  getSeverityLevel,
  SeverityLevel,
} from "@/lib/risk-factors";
import { getWoodWideClient, PortfolioDataRow } from "@/lib/woodwide";

interface PortfolioItem {
  ticker: string;
  shares: number;
}

interface PortfolioWithData {
  ticker: string;
  shares: number;
  name: string;
  sector: string;
  industry: string;
  price: number;
  value: number;
  weight: number;
}

interface PortfolioStats {
  totalValue: number;
  sectorWeights: Record<string, number>;
  largestPosition: { ticker: string; weight: number };
  holdings: PortfolioWithData[];
}

function analyzePortfolio(portfolio: PortfolioWithData[]): PortfolioStats {
  const totalValue = portfolio.reduce((sum, p) => sum + p.value, 0);

  // Calculate sector weights
  const sectorWeights: Record<string, number> = {};
  for (const holding of portfolio) {
    const sector = holding.sector || "Unknown";
    sectorWeights[sector] = (sectorWeights[sector] || 0) + holding.value;
  }

  // Convert to percentages
  for (const sector in sectorWeights) {
    sectorWeights[sector] = (sectorWeights[sector] / totalValue) * 100;
  }

  // Find largest position
  const withWeights = portfolio.map((p) => ({
    ...p,
    weight: (p.value / totalValue) * 100,
  }));

  const sorted = [...withWeights].sort((a, b) => b.weight - a.weight);
  const largestPosition = sorted[0]
    ? { ticker: sorted[0].ticker, weight: sorted[0].weight }
    : { ticker: "", weight: 0 };

  return {
    totalValue,
    sectorWeights,
    largestPosition,
    holdings: withWeights,
  };
}

function checkRiskFactor(
  factor: RiskFactor,
  stats: PortfolioStats,
): RiskAlert | null {
  const { holdings, totalValue, sectorWeights, largestPosition } = stats;

  // Special handling for concentration risks
  if (factor.id === "single_stock_concentration") {
    if (largestPosition.weight >= factor.thresholds.low) {
      return {
        riskFactor: {
          ...factor,
          name: `Single Stock Risk: ${largestPosition.ticker}`,
          hedgeKeywords: [largestPosition.ticker.toLowerCase()],
        },
        severity: getSeverityLevel(largestPosition.weight, factor.thresholds),
        severityScore: Math.min(100, largestPosition.weight),
        exposurePercent: largestPosition.weight,
        affectedTickers: [largestPosition.ticker],
        affectedValue: (largestPosition.weight / 100) * totalValue,
        hedgeKeywords: [largestPosition.ticker.toLowerCase()],
      };
    }
    return null;
  }

  if (factor.id === "sector_concentration") {
    const topSector = Object.entries(sectorWeights).sort(
      (a, b) => b[1] - a[1],
    )[0];
    if (topSector && topSector[1] >= factor.thresholds.low) {
      const sectorTickers = holdings
        .filter((h) => h.sector === topSector[0])
        .map((h) => h.ticker);

      return {
        riskFactor: {
          ...factor,
          name: `${topSector[0]} Sector Concentration`,
          hedgeKeywords: [topSector[0].toLowerCase()],
        },
        severity: getSeverityLevel(topSector[1], factor.thresholds),
        severityScore: Math.min(100, topSector[1]),
        exposurePercent: topSector[1],
        affectedTickers: sectorTickers,
        affectedValue: (topSector[1] / 100) * totalValue,
        hedgeKeywords: [topSector[0].toLowerCase()],
      };
    }
    return null;
  }

  // Standard trigger-based risk factors
  const { triggers } = factor;
  const matchedHoldings: PortfolioWithData[] = [];

  for (const holding of holdings) {
    let matches = false;

    // Check ticker match
    if (triggers.tickers?.includes(holding.ticker)) {
      matches = true;
    }

    // Check sector match
    if (triggers.sectors?.includes(holding.sector)) {
      matches = true;
    }

    // Check industry match
    if (triggers.industries?.includes(holding.industry)) {
      matches = true;
    }

    // Check keyword match in company name
    if (
      triggers.keywords?.some((kw) =>
        holding.name.toLowerCase().includes(kw.toLowerCase()),
      )
    ) {
      matches = true;
    }

    if (matches) {
      matchedHoldings.push(holding);
    }
  }

  if (matchedHoldings.length === 0) return null;

  // Calculate exposure
  const exposureValue = matchedHoldings.reduce((sum, h) => sum + h.value, 0);
  const exposurePercent = (exposureValue / totalValue) * 100;

  // Skip if below minimum threshold
  if (exposurePercent < factor.thresholds.low) return null;

  let severityScore: number;
  switch (factor.severityCalc) {
    case "exposure_pct":
      severityScore = exposurePercent;
      break;
    case "count":
      severityScore = (matchedHoldings.length / holdings.length) * 100;
      break;
    case "concentration":
      severityScore = exposurePercent;
      break;
    default:
      severityScore = exposurePercent;
  }

  return {
    riskFactor: factor,
    severity: getSeverityLevel(severityScore, factor.thresholds),
    severityScore: Math.min(100, severityScore),
    exposurePercent,
    affectedTickers: matchedHoldings.map((h) => h.ticker),
    affectedValue: exposureValue,
    hedgeKeywords: factor.hedgeKeywords,
  };
}

function generateSummary(alerts: RiskAlert[], stats: PortfolioStats): string {
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const high = alerts.filter((a) => a.severity === "high").length;
  const medium = alerts.filter((a) => a.severity === "medium").length;

  const parts: string[] = [];

  if (critical > 0) {
    parts.push(`${critical} critical risk${critical > 1 ? "s" : ""}`);
  }
  if (high > 0) {
    parts.push(`${high} high risk${high > 1 ? "s" : ""}`);
  }
  if (medium > 0) {
    parts.push(`${medium} moderate risk${medium > 1 ? "s" : ""}`);
  }

  if (parts.length === 0) {
    return `Your portfolio of ${stats.holdings.length} stocks shows good diversification with no major risk concentrations detected.`;
  }

  return `Risk analysis identified ${parts.join(", ")} across your ${stats.holdings.length}-stock portfolio worth $${stats.totalValue.toLocaleString()}.`;
}

function compareToTypicalPortfolio(stats: PortfolioStats): {
  metric: string;
  yourValue: string;
  typical: string;
  assessment: "better" | "worse" | "similar";
}[] {
  const comparisons = [];

  // Sector concentration comparison
  const topSectorWeight = Math.max(...Object.values(stats.sectorWeights));
  comparisons.push({
    metric: "Top Sector Weight",
    yourValue: `${topSectorWeight.toFixed(1)}%`,
    typical: "25-35%",
    assessment:
      topSectorWeight > 50
        ? ("worse" as const)
        : topSectorWeight < 35
          ? ("better" as const)
          : ("similar" as const),
  });

  // Single stock concentration
  comparisons.push({
    metric: "Largest Position",
    yourValue: `${stats.largestPosition.weight.toFixed(1)}%`,
    typical: "5-10%",
    assessment:
      stats.largestPosition.weight > 20
        ? ("worse" as const)
        : stats.largestPosition.weight < 10
          ? ("better" as const)
          : ("similar" as const),
  });

  // Number of holdings
  const holdingCount = stats.holdings.length;
  comparisons.push({
    metric: "Number of Holdings",
    yourValue: `${holdingCount}`,
    typical: "15-30",
    assessment:
      holdingCount < 5
        ? ("worse" as const)
        : holdingCount > 30
          ? ("similar" as const)
          : holdingCount >= 10
            ? ("better" as const)
            : ("similar" as const),
  });

  // Tech exposure (common concentration)
  const techWeight = stats.sectorWeights["Technology"] || 0;
  comparisons.push({
    metric: "Tech Exposure",
    yourValue: `${techWeight.toFixed(1)}%`,
    typical: "20-30%",
    assessment:
      techWeight > 50
        ? ("worse" as const)
        : techWeight < 30
          ? ("better" as const)
          : ("similar" as const),
  });

  return comparisons;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const portfolio: PortfolioItem[] = body.portfolio;

    if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
      return NextResponse.json(
        { error: "Portfolio is required" },
        { status: 400 },
      );
    }

    // Fetch stock data
    const tickers = portfolio.map((p) => p.ticker);
    const stockData = await getStockData(tickers);

    // Build portfolio with data
    const portfolioWithData: PortfolioWithData[] = portfolio.map((p) => {
      const stock = stockData.find((s) => s.ticker === p.ticker.toUpperCase());
      const price = stock?.price || 0;
      const value = price * p.shares;

      return {
        ticker: p.ticker.toUpperCase(),
        shares: p.shares,
        name: stock?.name || p.ticker,
        sector: stock?.sector || "Unknown",
        industry: stock?.industry || "Unknown",
        price,
        value,
        weight: 0, // Will be calculated in analyzePortfolio
      };
    });

    // Analyze portfolio structure
    const stats = analyzePortfolio(portfolioWithData);

    // Check all risk factors
    const alerts: RiskAlert[] = [];
    for (const factor of RISK_FACTORS) {
      const alert = checkRiskFactor(factor, stats);
      if (alert) {
        alerts.push(alert);
      }
    }

    // Sort by severity (critical first) then by exposure
    const severityOrder: Record<SeverityLevel, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    alerts.sort((a, b) => {
      const severityDiff =
        severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.exposurePercent - a.exposurePercent;
    });

    // Generate comparison to typical portfolio
    const benchmarkComparison = compareToTypicalPortfolio(stats);

    // Generate summary
    const summary = generateSummary(alerts, stats);

    // Wood Wide AI Integration - Anomaly Detection
    let woodWideAnalysis: {
      enabled: boolean;
      anomalies?: {
        ticker: string;
        anomalyScore: number;
        isAnomaly: boolean;
        reason?: string;
      }[];
      error?: string;
    } = { enabled: false };

    const woodWideClient = getWoodWideClient();
    if (woodWideClient && stats.holdings.length >= 3) {
      try {
        console.log("[RiskAnalysis] Running Wood Wide anomaly detection...");

        // Prepare data for Wood Wide
        const portfolioData: PortfolioDataRow[] = stats.holdings.map((h) => ({
          ticker: h.ticker,
          shares: h.shares,
          value: h.value,
          weight: h.weight,
          sector: h.sector,
          industry: h.industry,
        }));

        // Generate a session ID based on portfolio composition
        const sessionId = `risk_${Date.now()}_${stats.holdings.length}`;

        const result = await woodWideClient.analyzePortfolioAnomalies(
          portfolioData,
          sessionId,
        );

        // Map anomaly results back to tickers
        const anomalyResults = result.anomalies.map((a, idx) => {
          const holding = stats.holdings[idx];
          return {
            ticker: holding?.ticker || `Row ${a.row_index}`,
            anomalyScore: a.anomaly_score,
            isAnomaly: a.is_anomaly,
            reason: a.is_anomaly
              ? `Position size or weight is unusual compared to the rest of your portfolio`
              : undefined,
          };
        });

        woodWideAnalysis = {
          enabled: true,
          anomalies: anomalyResults.filter((a) => a.isAnomaly),
        };

        // Add Wood Wide anomalies as additional risk alerts
        for (const anomaly of anomalyResults.filter((a) => a.isAnomaly)) {
          const holding = stats.holdings.find(
            (h) => h.ticker === anomaly.ticker,
          );
          if (holding) {
            alerts.push({
              riskFactor: {
                id: `woodwide_anomaly_${anomaly.ticker}`,
                name: `Unusual Position: ${anomaly.ticker}`,
                category: "concentration",
                description: `Wood Wide AI detected this position as statistically unusual`,
                triggers: { tickers: [anomaly.ticker] },
                severityCalc: "exposure_pct",
                thresholds: { low: 0, medium: 30, high: 50, critical: 70 },
                impact:
                  anomaly.reason ||
                  "This position stands out from the rest of your portfolio pattern.",
                recommendation:
                  "Review if this concentration is intentional. Consider if the position size aligns with your risk tolerance.",
                hedgeKeywords: [anomaly.ticker.toLowerCase()],
              },
              severity: anomaly.anomalyScore > 0.8 ? "high" : "medium",
              severityScore: anomaly.anomalyScore * 100,
              exposurePercent: holding.weight,
              affectedTickers: [anomaly.ticker],
              affectedValue: holding.value,
              hedgeKeywords: [anomaly.ticker.toLowerCase()],
            });
          }
        }

        console.log(
          "[RiskAnalysis] Wood Wide found",
          woodWideAnalysis.anomalies?.length || 0,
          "anomalies",
        );
      } catch (error) {
        console.error("[RiskAnalysis] Wood Wide error:", error);
        woodWideAnalysis = {
          enabled: true,
          error:
            error instanceof Error
              ? error.message
              : "Wood Wide analysis failed",
        };
      }
    }

    // Re-sort alerts after adding Wood Wide results
    alerts.sort((a, b) => {
      const severityDiff =
        severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.exposurePercent - a.exposurePercent;
    });

    return NextResponse.json({
      summary,
      alerts,
      portfolioStats: {
        totalValue: stats.totalValue,
        holdingCount: stats.holdings.length,
        sectorWeights: stats.sectorWeights,
        largestPosition: stats.largestPosition,
      },
      benchmarkComparison,
      woodWideAnalysis,
      analysisTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Risk analysis error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Risk analysis failed",
      },
      { status: 500 },
    );
  }
}
