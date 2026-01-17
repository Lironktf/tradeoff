"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Shield, ArrowRight } from "lucide-react";
import type { RiskAlert } from "@/lib/risk-factors";
import type { StockInfo, HedgeRecommendation } from "@/app/page";

interface RiskCardProps {
  alert: RiskAlert;
  stockInfo?: Record<string, StockInfo>;
  hedges?: HedgeRecommendation[];
  onViewHedge?: (keywords: string[]) => void;
}

export function RiskCard({
  alert,
  stockInfo = {},
  hedges = [],
  onViewHedge,
}: RiskCardProps) {
  const {
    riskFactor,
    severity,
    severityScore,
    exposurePercent,
    affectedTickers,
    affectedValue,
    hedgeKeywords,
  } = alert;

  // Find matching hedges based on keywords
  const matchingHedges = hedges.filter((hedge) => {
    const hedgeText =
      `${hedge.market} ${hedge.reasoning} ${hedge.hedgesAgainst}`.toLowerCase();
    return hedgeKeywords.some((kw) => hedgeText.includes(kw.toLowerCase()));
  });

  const getSeverityStyles = () => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          text: "text-red-400",
          icon: "text-red-400",
          badge: "bg-red-500/20 text-red-400",
          label: "CRITICAL",
        };
      case "high":
        return {
          bg: "bg-orange-500/10",
          border: "border-orange-500/30",
          text: "text-orange-400",
          icon: "text-orange-400",
          badge: "bg-orange-500/20 text-orange-400",
          label: "HIGH",
        };
      case "medium":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
          text: "text-yellow-400",
          icon: "text-yellow-400",
          badge: "bg-yellow-500/20 text-yellow-400",
          label: "MODERATE",
        };
      case "low":
        return {
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          text: "text-green-400",
          icon: "text-green-400",
          badge: "bg-green-500/20 text-green-400",
          label: "LOW",
        };
    }
  };

  const styles = getSeverityStyles();

  const getCategoryIcon = () => {
    switch (riskFactor.category) {
      case "concentration":
        return <TrendingDown className={`w-5 h-5 ${styles.icon}`} />;
      case "geopolitical":
        return <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />;
      case "regulatory":
        return <Shield className={`w-5 h-5 ${styles.icon}`} />;
      case "event":
        return <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />;
      case "correlation":
        return <TrendingDown className={`w-5 h-5 ${styles.icon}`} />;
      default:
        return <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />;
    }
  };

  return (
    <Card className={`${styles.bg} ${styles.border} border`}>
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getCategoryIcon()}</div>
            <div>
              <h3 className="font-semibold text-foreground">
                {riskFactor.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {riskFactor.description}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${styles.badge}`}
            >
              {styles.label}
            </span>
            <span className="text-xs text-muted-foreground">
              Score: {severityScore.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Exposure
            </p>
            <p className="text-xl font-mono font-semibold mt-1">
              {exposurePercent.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              $
              {affectedValue.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
          <div className="bg-background/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Affected
            </p>
            <p className="text-xl font-mono font-semibold mt-1">
              {affectedTickers.length}
            </p>
            <p className="text-xs text-muted-foreground">
              stock{affectedTickers.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Affected Stocks */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Affected Holdings
          </p>
          <div className="flex flex-wrap gap-1.5">
            {affectedTickers.map((ticker) => {
              const info = stockInfo[ticker];
              return (
                <div key={ticker} className="group relative">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono ${styles.badge}`}
                  >
                    {ticker}
                  </span>
                  {info && (
                    <span className="absolute hidden group-hover:block bottom-full left-0 mb-1 px-2 py-1 bg-popover border border-border rounded text-xs whitespace-nowrap z-10">
                      {info.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Impact & Recommendation */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Why It Matters
            </p>
            <p className="text-sm text-foreground/90">{riskFactor.impact}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Recommendation
            </p>
            <p className="text-sm text-foreground/90">
              {riskFactor.recommendation}
            </p>
          </div>
        </div>

        {/* Hedge Link */}
        {matchingHedges.length > 0 && onViewHedge && (
          <button
            onClick={() => onViewHedge(hedgeKeywords)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg ${styles.bg} ${styles.border} border hover:bg-background/50 transition-colors`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">
                {matchingHedges.length} hedge
                {matchingHedges.length !== 1 ? "s" : ""} available
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {matchingHedges.length === 0 && hedgeKeywords.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/30 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Run hedge analysis to find relevant markets</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
