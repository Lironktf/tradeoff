"use client";

import { useState } from "react";
import { PortfolioInput } from "@/components/PortfolioInput";
import { HedgeRecommendations } from "@/components/HedgeRecommendations";
import { CompressionMetrics } from "@/components/CompressionMetrics";

export interface PortfolioItem {
  ticker: string;
  shares: number;
}

export interface HedgeRecommendation {
  market: string;
  marketUrl: string;
  probability: number;
  position: "YES" | "NO";
  reasoning: string;
  hedgesAgainst: string;
  suggestedAllocation: number;
}

export interface AnalysisResult {
  summary: string;
  recommendations: HedgeRecommendation[];
  compression: {
    originalTokens: number;
    compressedTokens: number;
    savings: number;
  };
}

export default function Home() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Header */}
      <header className="pt-16 pb-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Polymarket Hedge
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            AI-powered portfolio analysis. Find prediction market bets that hedge your stock exposure.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 pb-16">
        <div className="space-y-12">
          {/* Portfolio Input Section */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-6">Your Portfolio</h2>
            <PortfolioInput
              portfolio={portfolio}
              setPortfolio={setPortfolio}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
            {error && (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            )}
          </section>

          {/* Loading State */}
          {isAnalyzing && (
            <section className="text-center py-12">
              <div className="inline-flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span>Analyzing portfolio & compressing context...</span>
              </div>
            </section>
          )}

          {/* Results Section */}
          {analysisResult && !isAnalyzing && (
            <>
              <section>
                <h2 className="text-lg font-medium mb-6">Hedge Recommendations</h2>
                <HedgeRecommendations
                  summary={analysisResult.summary}
                  recommendations={analysisResult.recommendations}
                />
              </section>

              <CompressionMetrics compression={analysisResult.compression} />
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-3xl mx-auto text-center text-sm text-muted-foreground">
          Built for NexHacks 2026 &middot; Powered by Polymarket, The Token Company & xAI
        </div>
      </footer>
    </div>
  );
}
