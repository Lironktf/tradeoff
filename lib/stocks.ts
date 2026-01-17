import yahooFinance from "yahoo-finance2";

export interface StockData {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  marketCap: number;
  change: number;
  changePercent: number;
}

export async function getStockData(tickers: string[]): Promise<StockData[]> {
  const results: StockData[] = [];

  // Fetch quotes in parallel
  const promises = tickers.map(async (ticker) => {
    try {
      const quote = await yahooFinance.quote(ticker);
      
      return {
        ticker: ticker.toUpperCase(),
        name: quote.shortName || quote.longName || ticker,
        sector: quote.sector || "Unknown",
        industry: quote.industry || "Unknown",
        price: quote.regularMarketPrice || 0,
        marketCap: quote.marketCap || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
      };
    } catch (error) {
      console.error(`Error fetching data for ${ticker}:`, error);
      return {
        ticker: ticker.toUpperCase(),
        name: ticker,
        sector: "Unknown",
        industry: "Unknown",
        price: 0,
        marketCap: 0,
        change: 0,
        changePercent: 0,
      };
    }
  });

  const stockResults = await Promise.all(promises);
  results.push(...stockResults);

  return results;
}

export function analyzePortfolioExposure(stocks: StockData[]): {
  sectors: Record<string, number>;
  industries: Record<string, number>;
  totalValue: number;
} {
  const sectors: Record<string, number> = {};
  const industries: Record<string, number> = {};
  let totalValue = 0;

  for (const stock of stocks) {
    const value = stock.price;
    totalValue += value;

    if (stock.sector !== "Unknown") {
      sectors[stock.sector] = (sectors[stock.sector] || 0) + 1;
    }
    if (stock.industry !== "Unknown") {
      industries[stock.industry] = (industries[stock.industry] || 0) + 1;
    }
  }

  return { sectors, industries, totalValue };
}
