import YahooFinance from "yahoo-finance2";

// Initialize yahoo-finance2 client as the library requires
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

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
      // Use quoteSummary for more detailed info including sector
      const result = await yf.quoteSummary(ticker, {
        modules: ["price", "summaryProfile"],
      });
      
      const price = result.price;
      const profile = result.summaryProfile;
      
      return {
        ticker: ticker.toUpperCase(),
        name: price?.shortName || price?.longName || ticker,
        sector: profile?.sector || "Unknown",
        industry: profile?.industry || "Unknown",
        price: price?.regularMarketPrice || 0,
        marketCap: price?.marketCap || 0,
        change: price?.regularMarketChange || 0,
        changePercent: price?.regularMarketChangePercent || 0,
      };
    } catch (error) {
      // Only log if it's not a "not found" error (common for invalid tickers)
      if (error instanceof Error && !error.message.includes("not found")) {
        console.error(`Error fetching data for ${ticker}:`, error);
      }
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
