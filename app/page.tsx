"use client";

import { useState } from "react";
import { TabNav } from "@/components/TabNav";
import { HedgeView } from "@/components/hedge/HedgeView";
import { NewsView } from "@/components/news/NewsView";
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
  const [activeTab, setActiveTab] = useState<"hedge" | "news">("hedge");
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [stockInfo, setStockInfo] = useState<Record<string, StockInfo>>({});
  const [selectedBet, setSelectedBet] = useState<HedgeRecommendation | null>(null);
  const [cachedArticles, setCachedArticles] = useState<NewsArticle[]>([]);

  // When a bet is selected, switch to news tab
  const handleBetSelect = (bet: HedgeRecommendation | null) => {
    setSelectedBet(bet);
    if (bet) {
      setActiveTab("news");
    }
  };

  // Handle articles update from NewsView
  const handleArticlesUpdate = (articles: NewsArticle[]) => {
    setCachedArticles(articles);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Header */}
      <header className="pt-16 pb-6 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Polymarket Hedge
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8">
            AI-powered portfolio analysis. Find prediction market bets that hedge your stock exposure.
          </p>
          
          {/* Tabs */}
          <div className="flex justify-center">
            <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pb-16">
        {activeTab === "hedge" ? (
          <HedgeView
            portfolio={portfolio}
            setPortfolio={setPortfolio}
            stockInfo={stockInfo}
            setStockInfo={setStockInfo}
            onBetSelect={handleBetSelect}
          />
        ) : (
          <NewsView
            portfolio={portfolio}
            stockInfo={stockInfo}
            selectedBet={selectedBet}
            onBetSelect={handleBetSelect}
            cachedArticles={cachedArticles}
            onArticlesUpdate={handleArticlesUpdate}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          Built for NexHacks 2026 &middot; Powered by Polymarket, The Token Company & Groq
        </div>
      </footer>
    </div>
  );
}
