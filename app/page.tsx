"use client";

import { useState, useEffect, useCallback } from "react";
import { TabNav, type TabType } from "@/components/TabNav";
import { PortfolioView } from "@/components/portfolio/PortfolioView";
import { HedgeView } from "@/components/hedge/HedgeView";
import { NewsView } from "@/components/news/NewsView";
import { GreeksView } from "@/components/greeks/GreeksView";
import type { NewsArticle } from "@/app/api/news/route";

// Shared types - exported for use in other components
export interface PortfolioItem {
  ticker: string;
  shares: number;
}

export interface StockInfo {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
}

export interface HedgeRecommendation {
  market: string;
  marketUrl: string;
  outcome: string;
  probability: number;
  position: "YES" | "NO";
  reasoning: string;
  hedgesAgainst: string;
  suggestedAllocation: number;
  affectedStocks: string[];
  confidence: "high" | "medium";
}

export interface AnalysisResult {
  summary: string;
  recommendations: HedgeRecommendation[];
  stocksWithoutHedges: string[];
  compression: {
    originalTokens: number;
    compressedTokens: number;
    savings: number;
  };
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("portfolio");
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [stockInfo, setStockInfo] = useState<Record<string, StockInfo>>({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedBet, setSelectedBet] = useState<HedgeRecommendation | null>(null);
  const [cachedArticles, setCachedArticles] = useState<NewsArticle[]>([]);

  const handleBetSelect = (bet: HedgeRecommendation | null) => {
    setSelectedBet(bet);
  };

  const handleArticlesUpdate = (articles: NewsArticle[]) => {
    setCachedArticles(articles);
  };

  // Fetch stock data when portfolio changes
  const fetchStockData = useCallback(
    async (tickers: string[]) => {
      if (tickers.length === 0) return;

      const newTickers = tickers.filter((t) => !stockInfo[t]);
      if (newTickers.length === 0) return;

      try {
        const response = await fetch(
          `/api/stocks?tickers=${newTickers.join(",")}`
        );
        if (response.ok) {
          const data = await response.json();
          const newInfo: Record<string, StockInfo> = {};
          for (const stock of data.stocks) {
            newInfo[stock.ticker] = stock;
          }
          setStockInfo((prev) => ({ ...prev, ...newInfo }));
        }
      } catch (err) {
        console.error("Failed to fetch stock data:", err);
      }
    },
    [stockInfo]
  );

  useEffect(() => {
    const tickers = portfolio.map((p) => p.ticker);
    fetchStockData(tickers);
  }, [portfolio, fetchStockData]);

  // Clear analysis when portfolio changes significantly
  useEffect(() => {
    // Only clear if we have results and portfolio changed
    if (analysisResult) {
      const currentTickers = new Set(portfolio.map(p => p.ticker));
      const analyzedTickers = new Set(
        analysisResult.recommendations.flatMap(r => r.affectedStocks)
      );
      
      // Check if all analyzed stocks are still in portfolio
      const stillValid = [...analyzedTickers].every(t => currentTickers.has(t));
      if (!stillValid && portfolio.length > 0) {
        // Don't auto-clear, just let user re-analyze
      }
    }
  }, [portfolio, analysisResult]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Header */}
      <header className="pt-12 pb-4 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            Polymarket Terminal
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed mb-6">
            Advanced prediction market analytics & trading tools
          </p>
          
          {/* Tabs */}
          <div className="flex justify-center">
            <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 pb-16">
        {activeTab === "portfolio" && (
          <PortfolioView
            portfolio={portfolio}
            setPortfolio={setPortfolio}
            stockInfo={stockInfo}
            setStockInfo={setStockInfo}
          />
        )}
        {activeTab === "hedges" && (
          <HedgeView
            portfolio={portfolio}
            setPortfolio={setPortfolio}
            stockInfo={stockInfo}
            analysisResult={analysisResult}
            setAnalysisResult={setAnalysisResult}
            onGoToNews={() => setActiveTab("news")}
            onBetSelect={handleBetSelect}
          />
        )}
        {activeTab === "news" && (
          <NewsView
            portfolio={portfolio}
            stockInfo={stockInfo}
            selectedBet={selectedBet}
            onBetSelect={handleBetSelect}
            cachedArticles={cachedArticles}
            onArticlesUpdate={handleArticlesUpdate}
          />
        )}
        {activeTab === "greeks" && (
          <GreeksView
            recommendations={analysisResult?.recommendations || []}
            stockInfo={stockInfo}
            portfolioValue={portfolio.reduce((sum, p) => {
              const info = stockInfo[p.ticker];
              return sum + (info?.price || 0) * p.shares;
            }, 0) || 50000}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-5xl mx-auto text-center text-sm text-muted-foreground">
          Built for NexHacks 2026 &middot; Powered by Polymarket & Groq
        </div>
      </footer>
    </div>
  );
}
