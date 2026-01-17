"use client";

import { useState, useEffect, useCallback } from "react";
import { PortfolioInput } from "@/components/PortfolioInput";
import { PortfolioTable } from "@/components/PortfolioTable";
import { PortfolioCharts } from "@/components/PortfolioCharts";
import type { PortfolioItem, StockInfo } from "@/app/page";

interface PortfolioViewProps {
  portfolio: PortfolioItem[];
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioItem[]>>;
  stockInfo: Record<string, StockInfo>;
  setStockInfo: React.Dispatch<React.SetStateAction<Record<string, StockInfo>>>;
}

export function PortfolioView({
  portfolio,
  setPortfolio,
  stockInfo,
  setStockInfo,
}: PortfolioViewProps) {
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);

  // Fetch stock data when portfolio changes
  const fetchStockData = useCallback(
    async (tickers: string[]) => {
      if (tickers.length === 0) return;

      const newTickers = tickers.filter((t) => !stockInfo[t]);
      if (newTickers.length === 0) return;

      setIsLoadingStocks(true);
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
      } finally {
        setIsLoadingStocks(false);
      }
    },
    [stockInfo, setStockInfo]
  );

  useEffect(() => {
    const tickers = portfolio.map((p) => p.ticker);
    fetchStockData(tickers);
  }, [portfolio, fetchStockData]);

  const handleRemove = (ticker: string) => {
    setPortfolio((prev) => prev.filter((p) => p.ticker !== ticker));
  };

  // Calculate total value
  const totalValue = portfolio.reduce((sum, p) => {
    const info = stockInfo[p.ticker];
    return sum + (info?.price || 0) * p.shares;
  }, 0);

  return (
    <div className="space-y-6">
      {portfolio.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-medium mb-6">Add Your Portfolio</h2>
          <PortfolioInput
            portfolio={portfolio}
            setPortfolio={setPortfolio}
          />
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                <p className="text-3xl font-semibold font-mono">
                  ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Holdings</p>
                <p className="text-3xl font-semibold">{portfolio.length}</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <PortfolioCharts portfolio={portfolio} stockInfo={stockInfo} />

          {/* Add more stocks - MOVED ABOVE holdings */}
          <div className="bg-card border border-border rounded-lg p-4">
            <PortfolioInput
              portfolio={portfolio}
              setPortfolio={setPortfolio}
              compact
            />
          </div>

          {/* Holdings Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-medium">Holdings</h2>
              <button
                onClick={() => setPortfolio([])}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </div>
            <PortfolioTable
              portfolio={portfolio}
              stockInfo={stockInfo}
              onRemove={handleRemove}
              isLoading={isLoadingStocks}
            />
          </div>
        </>
      )}
    </div>
  );
}
