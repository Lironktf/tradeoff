"use client";

import { useState, useEffect, useCallback } from "react";
import { PortfolioInput } from "@/components/PortfolioInput";
import { PortfolioTable } from "@/components/PortfolioTable";
import { PortfolioCharts } from "@/components/PortfolioCharts";
import { HedgeRecommendations } from "@/components/HedgeRecommendations";
import { CompressionMetrics } from "@/components/CompressionMetrics";
import type { PortfolioItem, StockInfo, AnalysisResult } from "@/app/page";

interface HedgeViewProps {
  portfolio: PortfolioItem[];
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioItem[]>>;
  stockInfo: Record<string, StockInfo>;
  setStockInfo: React.Dispatch<React.SetStateAction<Record<string, StockInfo>>>;
  onBetSelect?: (bet: import("@/app/page").HedgeRecommendation | null) => void;
}

export function HedgeView({ 
  portfolio, 
  setPortfolio, 
  stockInfo, 
  setStockInfo,
  onBetSelect
}: HedgeViewProps) {
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stock data when portfolio changes
  const fetchStockData = useCallback(async (tickers: string[]) => {
    if (tickers.length === 0) return;
    
    const newTickers = tickers.filter((t) => !stockInfo[t]);
    if (newTickers.length === 0) return;

    setIsLoadingStocks(true);
    try {
      const response = await fetch(`/api/stocks?tickers=${newTickers.join(",")}`);
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
    } finally {
      setIsLoadingStocks(false);
    }
  }, [stockInfo, setStockInfo]);

  useEffect(() => {
    const tickers = portfolio.map((p) => p.ticker);
    fetchStockData(tickers);
  }, [portfolio, fetchStockData]);

  const handleRemove = (ticker: string) => {
    setPortfolio((prev) => prev.filter((p) => p.ticker !== ticker));
  };

  const handleAnalyze = async () => {
    if (portfolio.length === 0) {
      setError("Please add at least one stock to your portfolio");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Analysis failed");
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Portfolio Section */}
      <section className="space-y-6">
        {portfolio.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-6">Your Portfolio</h2>
            <PortfolioInput
              portfolio={portfolio}
              setPortfolio={setPortfolio}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          </div>
        ) : (
          <>
            <PortfolioCharts portfolio={portfolio} stockInfo={stockInfo} />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Holdings</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPortfolio([])}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              </div>
              <PortfolioTable
                portfolio={portfolio}
                stockInfo={stockInfo}
                onRemove={handleRemove}
                isLoading={isLoadingStocks}
              />
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <PortfolioInput
                portfolio={portfolio}
                setPortfolio={setPortfolio}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                compact
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </section>

      {/* Loading State */}
      {isAnalyzing && (
        <section className="text-center py-12">
          <div className="inline-flex items-center gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span>Finding stock-specific hedges...</span>
          </div>
        </section>
      )}

      {/* Results Section */}
      {analysisResult && !isAnalyzing && (
        <>
          <section>
            <HedgeRecommendations
              summary={analysisResult.summary}
              recommendations={analysisResult.recommendations}
              stocksWithoutHedges={analysisResult.stocksWithoutHedges}
              stockInfo={stockInfo}
              onBetSelect={onBetSelect}
            />
          </section>

          <CompressionMetrics compression={analysisResult.compression} />
        </>
      )}
    </div>
  );
}
