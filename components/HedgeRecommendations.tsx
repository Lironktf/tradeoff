"use client";

import { HedgeCard } from "./HedgeCard";
import type { HedgeRecommendation, StockInfo } from "@/app/page";

interface HedgeRecommendationsProps {
  summary: string;
  recommendations: HedgeRecommendation[];
  stocksWithoutHedges?: string[];
  stockInfo?: Record<string, StockInfo>;
  onBetSelect?: (bet: HedgeRecommendation | null) => void;
}

export function HedgeRecommendations({
  summary,
  recommendations,
  stocksWithoutHedges = [],
  stockInfo = {},
  onBetSelect,
}: HedgeRecommendationsProps) {
  // Recommendations should already be sorted by affected stocks count
  // Just ensure they are
  const sortedRecs = [...recommendations].sort(
    (a, b) => b.affectedStocks.length - a.affectedStocks.length
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-3">Hedge Recommendations</h2>
        <p className="text-muted-foreground leading-relaxed">{summary}</p>
      </div>

      {sortedRecs.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            No strong hedges found for your portfolio. This can happen when there are no 
            Polymarket events directly related to your specific stocks.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRecs.map((rec, idx) => (
            <HedgeCard 
              key={`${rec.market}-${idx}`} 
              recommendation={rec}
              stockInfo={stockInfo}
              onBetSelect={onBetSelect}
            />
          ))}
        </div>
      )}

      {/* Stocks without hedges */}
      {stocksWithoutHedges.length > 0 && (
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">No direct hedges found for: </span>
            {stocksWithoutHedges.map((stock, i) => (
              <span key={stock}>
                <span className="font-mono">{stock}</span>
                {i < stocksWithoutHedges.length - 1 && ", "}
              </span>
            ))}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            These stocks don&apos;t have Polymarket events that directly relate to them.
          </p>
        </div>
      )}
    </div>
  );
}
