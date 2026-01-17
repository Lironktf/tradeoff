"use client";

import type { PortfolioItem, StockInfo } from "@/app/page";

interface NewsViewProps {
  portfolio: PortfolioItem[];
  stockInfo: Record<string, StockInfo>;
}

export function NewsView({ portfolio, stockInfo }: NewsViewProps) {
  if (portfolio.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <h2 className="text-lg font-medium mb-2">No Portfolio Data</h2>
        <p className="text-muted-foreground">
          Add stocks to your portfolio in the Portfolio tab to see relevant news.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Market News</h2>
        <p className="text-muted-foreground">
          News and events affecting your holdings
        </p>
      </div>

      {/* News Section - To be implemented */}
      <section>
        <h3 className="text-lg font-medium mb-4">Latest News</h3>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-muted-foreground text-center py-4 mb-4">
            News feed coming soon...
          </p>
          
          {/* Placeholder for news cards */}
          <div className="space-y-4">
            {portfolio.map((item) => {
              const info = stockInfo[item.ticker];
              return (
                <div 
                  key={item.ticker}
                  className="p-4 bg-secondary/30 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-accent/15 text-accent rounded font-mono text-sm font-medium">
                      {item.ticker}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {info?.name || item.ticker}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    News articles for {item.ticker} will appear here...
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Related Polymarket Events */}
      <section>
        <h3 className="text-lg font-medium mb-4">Related Prediction Markets</h3>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-muted-foreground text-center py-8">
            Related Polymarket events coming soon...
          </p>
        </div>
      </section>

      {/* Market Sentiment */}
      <section>
        <h3 className="text-lg font-medium mb-4">Market Sentiment</h3>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-muted-foreground text-center py-8">
            Sentiment analysis coming soon...
          </p>
        </div>
      </section>
    </div>
  );
}

// Keep old export for backwards compatibility
export const AnalyticsView = NewsView;
