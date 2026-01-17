"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { HedgeRecommendation, StockInfo } from "@/app/page";

interface HedgeCardProps {
  recommendation: HedgeRecommendation;
  stockInfo?: Record<string, StockInfo>;
}

export function HedgeCard({ recommendation, stockInfo = {} }: HedgeCardProps) {
  const {
    market,
    marketUrl,
    outcome,
    probability,
    position,
    reasoning,
    suggestedAllocation,
    affectedStocks,
  } = recommendation;

  const stockCount = affectedStocks.length;
  const currentOdds = Math.round(probability * 100);

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5 space-y-4">
        {/* Affected Stocks */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            Hedges {stockCount} stock{stockCount !== 1 ? "s" : ""}:
          </span>
          {affectedStocks.map((ticker) => {
            const info = stockInfo[ticker];
            return (
              <div key={ticker} className="group relative">
                <span className="px-2 py-0.5 rounded bg-accent/15 text-accent font-mono text-sm border border-accent/20">
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

        {/* Market & Bet Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <a
              href={marketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-accent transition-colors font-medium inline-flex items-start gap-1"
            >
              <span className="line-clamp-2">{market}</span>
              <span className="text-muted-foreground hover:text-accent shrink-0">↗</span>
            </a>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-mono font-semibold">{currentOdds}%</span>
            <p className="text-xs text-muted-foreground">odds</p>
          </div>
        </div>

        {/* Outcome to bet on */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Bet:</span>
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${
              position === "YES"
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {position} on &quot;{outcome}&quot;
          </span>
          <span className="text-sm text-muted-foreground">•</span>
          <span className="text-sm font-mono">${suggestedAllocation}</span>
        </div>

        {/* One-line reasoning */}
        <p className="text-sm text-muted-foreground">{reasoning}</p>
      </CardContent>
    </Card>
  );
}
