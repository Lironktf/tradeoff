"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PortfolioItem, StockInfo, HedgeRecommendation } from "@/app/page";
import type { NewsArticle } from "@/app/api/news/route";

interface NewsViewProps {
  portfolio: PortfolioItem[];
  stockInfo: Record<string, StockInfo>;
  selectedBet?: HedgeRecommendation | null;
  onBetSelect?: (bet: HedgeRecommendation | null) => void;
  cachedArticles?: NewsArticle[];
  onArticlesUpdate?: (articles: NewsArticle[]) => void;
}

export function NewsView({
  portfolio,
  stockInfo,
  selectedBet,
  onBetSelect,
  cachedArticles = [],
  onArticlesUpdate,
}: NewsViewProps) {
  const [articles, setArticles] = useState<NewsArticle[]>(cachedArticles);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>("all");

  const fetchNews = useCallback(async () => {
    if (portfolio.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const requestBody = {
        portfolio,
        betMarket: selectedBet?.market,
      };
      
      console.log("Fetching news with:", { 
        portfolioCount: portfolio.length, 
        betMarket: selectedBet?.market 
      });

      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch news");
      }

      const data = await response.json();
      const newArticles = data.articles || [];
      
      console.log("Received articles:", newArticles.length);
      
      setArticles(newArticles);
      // Only update cache if we're not viewing a specific bet
      // (bet-specific news shouldn't replace general portfolio news cache)
      if (onArticlesUpdate && !selectedBet) {
        onArticlesUpdate(newArticles);
      }
      setSelectedArticle(null); // Reset selected article when fetching new news
    } catch (err) {
      console.error("Error fetching news:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [portfolio, selectedBet, onArticlesUpdate]);

  // Fetch news when portfolio or selectedBet changes
  useEffect(() => {
    if (portfolio.length === 0) {
      setArticles([]);
      return;
    }

    // If a bet is selected, always fetch news for that bet (don't use cache)
    if (selectedBet) {
      fetchNews();
      return;
    }

    // If no bet selected and we have cached articles, use them
    if (cachedArticles.length > 0 && !selectedBet) {
      setArticles(cachedArticles);
      return;
    }

    // Otherwise fetch new articles
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio.length, selectedBet?.market]); // Fetch when portfolio or selected bet changes

  const handleBackToList = () => {
    setSelectedArticle(null);
    if (onBetSelect) {
      onBetSelect(null);
    }
  };

  if (portfolio.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <h2 className="text-lg font-medium mb-2">No Portfolio Data</h2>
        <p className="text-muted-foreground">
          Add stocks to your portfolio in the Hedge Advisor tab to see relevant news.
        </p>
      </div>
    );
  }

  // Show detail view for selected article
  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={handleBackToList}
          className="mb-4"
        >
          ← Back to Articles
        </Button>

        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div>
              <h1 className="text-2xl font-semibold mb-2">{selectedArticle.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{selectedArticle.source}</span>
                <span>•</span>
                <span>{selectedArticle.publishedAt}</span>
              </div>
            </div>

            {selectedBet && (
              <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                <p className="text-sm font-medium mb-2">Related Polymarket Bet:</p>
                <p className="text-sm text-foreground font-medium mb-1">
                  &ldquo;{selectedBet.market}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedBet.reasoning}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent">
                    Probability: {Math.round(selectedBet.probability * 100)}%
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent">
                    Bet {selectedBet.position}
                  </span>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-medium mb-2">Relevance</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedArticle.relevance}</p>
            </div>

            {selectedArticle.relatedStocks.length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-2">Related Stocks</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.relatedStocks.map((ticker) => {
                    const info = stockInfo[ticker];
                    return (
                      <span
                        key={ticker}
                        className="px-2 py-1 rounded bg-accent/15 text-accent font-mono text-sm border border-accent/20"
                      >
                        {ticker}
                        {info && ` (${info.name})`}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={() => {
                  if (selectedArticle.url) {
                    window.open(selectedArticle.url, "_blank", "noopener,noreferrer");
                  }
                }}
                className="w-full"
                disabled={!selectedArticle.url}
              >
                Read Full Article →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show list view
  return (
    <div className="space-y-6">
      {/* Header with bet context if selected */}
      {selectedBet && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Viewing news for:</p>
              <p className="text-foreground font-medium mb-2">
                &ldquo;{selectedBet.market}&rdquo;
              </p>
              <p className="text-sm text-muted-foreground">{selectedBet.reasoning}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onBetSelect) {
                  onBetSelect(null);
                }
              }}
            >
              Show All News
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium">
          {selectedBet ? "News for Selected Bet" : "Portfolio News"}
        </h2>
        <div className="flex items-center gap-3">
          {/* Stock Filter Dropdown */}
          <select
            value={selectedStockFilter}
            onChange={(e) => setSelectedStockFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Stocks</option>
            {portfolio.map((item) => {
              const info = stockInfo[item.ticker];
              return (
                <option key={item.ticker} value={item.ticker}>
                  {item.ticker} {info ? `(${info.name})` : ''}
                </option>
              );
            })}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNews}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span>Fetching news articles...</span>
          </div>
        </div>
      )}

      {!isLoading && articles.length === 0 && !error && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No news articles found.</p>
        </div>
      )}

      {!isLoading && articles.length > 0 && (
        <div className="space-y-4">
          {articles
            .filter((article) => {
              if (selectedStockFilter === "all") return true;
              return article.relatedStocks.includes(selectedStockFilter);
            })
            .map((article, idx) => (
            <Card
              key={idx}
              className="bg-card border-border hover:border-accent/50 transition-colors cursor-pointer"
              onClick={() => setSelectedArticle(article)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{article.publishedAt}</span>
                  </div>
                  {article.relatedStocks.length > 0 && (
                    <div className="flex gap-1">
                      {article.relatedStocks.slice(0, 3).map((ticker) => (
                        <span
                          key={ticker}
                          className="px-2 py-0.5 rounded bg-accent/15 text-accent font-mono text-xs border border-accent/20"
                        >
                          {ticker}
                        </span>
                      ))}
                      {article.relatedStocks.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-muted-foreground">
                          +{article.relatedStocks.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {article.relevance}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
