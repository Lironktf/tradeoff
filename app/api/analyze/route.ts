import { NextRequest, NextResponse } from "next/server";
import { getStockData } from "@/lib/stocks";
import { fetchActiveEvents, formatEventsForContext, findEventByKeywords, getEventUrl } from "@/lib/polymarket";
import { compressWithBear1, buildContextForAnalysis, estimateTokens } from "@/lib/compression";
import { analyzeWithGrok } from "@/lib/grok";

interface PortfolioItem {
  ticker: string;
  shares: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const portfolio: PortfolioItem[] = body.portfolio;

    if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
      return NextResponse.json(
        { error: "Portfolio is required" },
        { status: 400 }
      );
    }

    // Get API keys from environment
    const tokenCompanyKey = process.env.TOKEN_COMPANY_API_KEY || "";
    // Support both GROQ_API_KEY and GROK_API_KEY for flexibility
    const groqApiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || "";

    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Groq API key not configured. Add GROQ_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    // Fetch stock data and Polymarket events in parallel
    const tickers = portfolio.map((p) => p.ticker);
    const [stockData, events] = await Promise.all([
      getStockData(tickers),
      fetchActiveEvents(100),
    ]);

    // Combine portfolio with stock data
    const portfolioWithData = portfolio.map((p) => {
      const stock = stockData.find((s) => s.ticker === p.ticker.toUpperCase());
      return {
        ticker: p.ticker.toUpperCase(),
        shares: p.shares,
        sector: stock?.sector || "Unknown",
        industry: stock?.industry || "Unknown",
      };
    });

    // Format events for context - includes slugs for LLM reference
    const eventsContext = formatEventsForContext(events);

    // Build full context
    const fullContext = buildContextForAnalysis(portfolioWithData, eventsContext);
    const originalTokens = estimateTokens(fullContext);

    // Compress context if API key is available
    let compressedContext = fullContext;
    let compressedTokens = originalTokens;
    let savings = 0;

    if (tokenCompanyKey) {
      const compressionResult = await compressWithBear1(fullContext, tokenCompanyKey);
      compressedContext = compressionResult.compressed;
      compressedTokens = compressionResult.compressedTokens;
      savings = compressionResult.savings;
    }

    // Analyze with Groq (will try multiple models with fallback)
    const analysis = await analyzeWithGrok(compressedContext, groqApiKey);

    // Add market URLs to recommendations by matching to actual events
    const recommendationsWithUrls = analysis.recommendations.map((rec) => {
      // Try to find the matching event by keywords in the market name
      const matchedEvent = findEventByKeywords(events, rec.market);
      
      return {
        ...rec,
        marketUrl: matchedEvent 
          ? getEventUrl(matchedEvent.slug)
          : `https://polymarket.com/markets?_q=${encodeURIComponent(rec.market.slice(0, 30))}`,
      };
    });

    return NextResponse.json({
      summary: analysis.summary,
      recommendations: recommendationsWithUrls,
      compression: {
        originalTokens,
        compressedTokens,
        savings,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
