import { NextRequest, NextResponse } from "next/server";
import { getStockData } from "@/lib/stocks";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "moonshotai/kimi-k2-instruct",
  "qwen/qwen3-32b",
  "llama-3.1-8b-instant",
];

interface PortfolioItem {
  ticker: string;
  shares: number;
}

export interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  relevance: string;
  relatedStocks: string[];
}

const NEWS_SYSTEM_PROMPT = `You are a financial news analyst. Your task is to analyze real news articles and provide relevance context.

Given a list of real news articles with titles, summaries, and URLs, analyze them for relevance to the portfolio stocks.

Return a JSON array with enhanced relevance information:
[
  {
    "relevance": "Why this article is relevant to the portfolio. Provide 2-4 sentences explaining the connection, potential impact on stock prices, and why portfolio holders should care. Be specific and detailed.",
    "relatedStocks": ["TICKER1", "TICKER2"],
    "keyPoints": ["Key point 1", "Key point 2"],
    "isRelevant": true
  }
]

RELEVANCE FILTERING RULES:
- Mark articles as relevant (isRelevant: true) if there is a connection to the portfolio stocks, even if indirect
- Only mark isRelevant: false if the article explicitly states it's "not relevant", "not really relevant", "unrelated", or has "no clear connection"
- Include articles that mention the stocks, even if the connection is indirect or speculative
- Be generous with relevance - it's better to show potentially relevant articles than to filter too aggressively

IMPORTANT:
- Return ONLY valid JSON, no markdown or extra text
- Match the order of articles provided exactly
- Focus on how each article affects the specific stocks
- Be specific about why it matters for the portfolio
- Write detailed relevance explanations (2-4 sentences, not truncated)
- Only mark isRelevant: true for articles with clear, direct relevance`;

async function fetchYahooFinanceNews(tickers: string[]): Promise<any[]> {
  const allNews: any[] = [];
  
  // Fetch news for each ticker using Yahoo Finance's public API
  for (const ticker of tickers) {
    try {
      // Use Yahoo Finance's quoteSummary with news module
      const response = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${ticker}&quotesCount=1&newsCount=5`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.news && Array.isArray(data.news)) {
        allNews.push(...data.news.map((item: any) => ({
          title: item.title,
          summary: item.summary || item.description || item.excerpt || item.snippet || item.text || '',
          link: item.link,
          url: item.link,
          providerPublishTime: item.providerPublishTime,
          pubDate: item.providerPublishTime,
          publisher: item.publisher || item.source,
          source: item.publisher || item.source,
          uuid: item.uuid,
          relatedTicker: ticker,
          rawData: item, // Keep raw data for debugging
        })));
      }
    } catch (error) {
      console.error(`Error fetching news for ${ticker}:`, error);
      // Try alternative endpoint
      try {
        const altResponse = await fetch(
          `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${ticker}&region=US&lang=en-US`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0',
            },
          }
        );
        
        if (altResponse.ok) {
          const text = await altResponse.text();
          // Parse RSS (simplified - you might want to use an RSS parser)
          // For now, we'll skip RSS and continue
        }
      } catch (altError) {
        console.error(`Alternative fetch also failed for ${ticker}:`, altError);
      }
    }
  }
  
  // Deduplicate by URL
  const seen = new Set<string>();
  return allNews.filter(item => {
    const url = item.link || item.url;
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

async function fetchNewsViaGroqSearch(
  tickers: string[],
  portfolioContext: string,
  apiKey: string
): Promise<any[]> {
  // Use Groq to find real news articles with proper search URLs
  const searchPrompt = `Find 10-15 recent, real news articles about these stocks: ${tickers.join(', ')}.

For each article, provide:
- A real, current article title
- The actual news source (Bloomberg, Reuters, WSJ, Yahoo Finance, etc.)
- A search URL that will find this article (e.g., Google News search URL or the actual article URL if you know it)
- A realistic recent date (within the last 7 days)

Return JSON array:
[
  {
    "title": "Real article headline",
    "summary": "Brief summary",
    "source": "Source name",
    "link": "https://www.google.com/search?q=article+title+site:bloomberg.com OR actual URL",
    "providerPublishTime": 1234567890,
    "publisher": "Source name",
    "relatedTicker": "TICKER"
  }
]

IMPORTANT: Use real, current news. Create search URLs that will find actual articles.`;

  for (const model of GROQ_MODELS) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: `${searchPrompt}\n\nPortfolio context:\n${portfolioContext}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2500,
        }),
      });

      if (response.status === 429) continue;

      if (!response.ok) continue;

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) continue;

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) continue;

      const articles = JSON.parse(jsonMatch[0]);
      return articles.map((article: any) => ({
        ...article,
        url: article.link || article.url,
      }));
    } catch (error) {
      console.error(`Error with model ${model} for news search:`, error);
      continue;
    }
  }

  return [];
}

async function enhanceNewsWithGroq(
  articles: any[],
  portfolioContext: string,
  apiKey: string
): Promise<Array<{ relevance: string; relatedStocks: string[]; keyPoints: string[]; isRelevant: boolean }>> {
  if (articles.length === 0) return [];

  const articlesContext = articles.map((article, idx) => {
    const summary = article.summary || article.description || article.excerpt || article.snippet || article.text || '';
    return `${idx + 1}. "${article.title}"${summary ? ` - ${summary}` : ''}`;
  }).join('\n\n');

  for (const model of GROQ_MODELS) {
    try {
      console.log(`Enhancing news with model: ${model}`);
      
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: NEWS_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Analyze these news articles for relevance to this portfolio:\n\n${portfolioContext}\n\nArticles:\n${articlesContext}\n\nReturn a JSON array matching the order of articles.`,
            },
          ],
          temperature: 0.5,
          max_tokens: 2000,
        }),
      });

      if (response.status === 429) {
        console.log(`Model ${model} rate limited`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Groq API error for ${model}:`, response.status, errorText);
        
        if (response.status === 400 || response.status === 404) {
          continue;
        }
        
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content in Groq response");
      }

      // Extract JSON from response - try multiple strategies
      let jsonMatch = content.match(/\[[\s\S]*\]/);
      
      // If no array found, try to find JSON object and wrap it
      if (!jsonMatch) {
        const objMatch = content.match(/\{[\s\S]*\}/);
        if (objMatch) {
          jsonMatch = [`[${objMatch[0]}]`];
        }
      }
      
      if (!jsonMatch) {
        throw new Error("Could not parse JSON array from Groq response");
      }

      let jsonString = jsonMatch[0];
      
      // Try to fix common JSON issues
      // Remove trailing commas before closing brackets/braces (more careful)
      jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
      
      let enhancements;
      try {
        enhancements = JSON.parse(jsonString);
      } catch (parseError) {
        // Try to extract just the array part more carefully
        const arrayStart = jsonString.indexOf('[');
        const arrayEnd = jsonString.lastIndexOf(']');
        if (arrayStart >= 0 && arrayEnd > arrayStart) {
          let extractedJson = jsonString.substring(arrayStart, arrayEnd + 1);
          // Try fixing trailing commas again on extracted portion
          extractedJson = extractedJson.replace(/,(\s*[}\]])/g, '$1');
          try {
            enhancements = JSON.parse(extractedJson);
          } catch (e) {
            // Last resort: try to parse each object individually if it's an array
            console.warn(`Failed to parse JSON array, attempting fallback parsing for model ${model}`);
            throw parseError;
          }
        } else {
          throw parseError;
        }
      }
      
      // Validate it's an array
      if (!Array.isArray(enhancements)) {
        throw new Error("Groq response is not a JSON array");
      }
      
      console.log(`Successfully enhanced ${enhancements.length} articles with model: ${model}`);
      
      return enhancements;
    } catch (error) {
      console.error(`Error with model ${model}:`, error);
      continue;
    }
  }

  // Fallback: return basic enhancements
  return articles.map((article) => ({
    relevance: `News about ${article.relatedTicker || 'the market'}`,
    relatedStocks: article.relatedTicker ? [article.relatedTicker] : [],
    keyPoints: [],
    isRelevant: true, // Default to true for fallback
  }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const portfolio: PortfolioItem[] = body.portfolio;
    const betMarket: string | undefined = body.betMarket; // Optional: specific bet to get news for

    if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
      return NextResponse.json(
        { error: "Portfolio is required" },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || "";

    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Groq API key not configured. Add GROQ_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    // Fetch stock data
    const tickers = portfolio.map((p) => p.ticker);
    const stockData = await getStockData(tickers);

    // Build portfolio context
    const portfolioWithData = portfolio.map((p) => {
      const stock = stockData.find((s) => s.ticker === p.ticker.toUpperCase());
      return {
        ticker: p.ticker.toUpperCase(),
        shares: p.shares,
        name: stock?.name || p.ticker,
        sector: stock?.sector || "Unknown",
        industry: stock?.industry || "Unknown",
        price: stock?.price || 0,
      };
    });

    const portfolioContext = portfolioWithData
      .map(
        (p) =>
          `- ${p.ticker} (${p.name}): ${p.shares} shares, ${p.sector} sector, ${p.industry} industry`
      )
      .join("\n");

    let context = `Portfolio stocks:\n${portfolioContext}`;

    // If specific bet market is provided, focus on that
    if (betMarket) {
      context += `\n\nFocus on news related to this Polymarket bet: "${betMarket}"`;
    }

    // Fetch real news from Yahoo Finance
    let yahooNews = await fetchYahooFinanceNews(tickers);
    
    // If no news found, try a fallback approach
    if (yahooNews.length === 0) {
      console.log("Yahoo Finance API returned no news, trying alternative approach...");
      // Fallback: Use Groq to find real news articles with search URLs
      yahooNews = await fetchNewsViaGroqSearch(tickers, context, groqApiKey);
    }
    
    // Limit to most recent 15 articles
    const recentNews = yahooNews
      .sort((a, b) => {
        const dateA = a.providerPublishTime || a.pubDate || Date.now() / 1000;
        const dateB = b.providerPublishTime || b.pubDate || Date.now() / 1000;
        return dateB - dateA;
      })
      .slice(0, 15);

    // Enhance with Groq for relevance
    let enhancements: Array<{ relevance: string; relatedStocks: string[]; keyPoints: string[]; isRelevant: boolean }> = [];
    try {
      enhancements = await enhanceNewsWithGroq(recentNews, context, groqApiKey);
    } catch (error) {
      console.error("Error enhancing news:", error);
      // Use fallback enhancements
      enhancements = recentNews.map((article) => ({
        relevance: `Recent news about ${article.relatedTicker || 'the market'}`,
        relatedStocks: article.relatedTicker ? [article.relatedTicker] : [],
        keyPoints: [],
        isRelevant: true, // Default to true for fallback
      }));
    }

    // Combine real news with enhancements and filter out irrelevant articles
    let articles: NewsArticle[] = recentNews
      .map((article, idx) => {
        const enhancement = enhancements[idx] || enhancements[0] || {
          relevance: "Financial news article",
          relatedStocks: article.relatedTicker ? [article.relatedTicker] : [],
          keyPoints: [],
          isRelevant: true,
        };

        // Check if article is marked as relevant
        // Only filter if explicitly marked as false, otherwise include it
        const isRelevant = enhancement.isRelevant !== false; // Default to true if not specified
        
        // Only filter based on explicit "not really relevant" or "not relevant" phrases
        // Don't filter on weaker indicators like "maybe" or "possibly" as those might still be useful
        const relevanceText = (enhancement.relevance || '').toLowerCase();
        const strongNegativeIndicators = [
          'not really relevant',
          'not relevant',
          'not particularly relevant',
          'not especially relevant',
          'not directly relevant',
          'no clear connection',
          'unrelated',
        ];
        
        const hasStrongNegative = strongNegativeIndicators.some(indicator => 
          relevanceText.includes(indicator)
        );

        return {
          article,
          enhancement,
          isRelevant: isRelevant && !hasStrongNegative,
        };
      })
      .filter(({ isRelevant }) => isRelevant) // Filter out irrelevant articles
      .map(({ article, enhancement }) => {
        // Format date - Yahoo Finance uses Unix timestamp (seconds or milliseconds)
        let publishTime: number;
        if (article.providerPublishTime) {
          publishTime = article.providerPublishTime > 1e12 
            ? article.providerPublishTime / 1000  // milliseconds to seconds
            : article.providerPublishTime;
        } else if (article.pubDate) {
          publishTime = article.pubDate > 1e12 
            ? article.pubDate / 1000 
            : article.pubDate;
        } else {
          publishTime = Date.now() / 1000; // Current time in seconds
        }
        
        const publishDate = new Date(publishTime * 1000);
        const formattedDate = publishDate.toISOString().split('T')[0];

        // Get URL - Yahoo Finance articles can have various URL fields
        let articleUrl = article.link || article.url || article.canonicalUrl;
        
        // If no URL found, try to construct one from UUID or use a search URL
        if (!articleUrl) {
          if (article.uuid) {
            articleUrl = `https://finance.yahoo.com/news/${article.uuid}`;
          } else {
            // Fallback: create a search URL for the article title
            const searchQuery = encodeURIComponent(article.title || '');
            articleUrl = `https://finance.yahoo.com/news?q=${searchQuery}`;
          }
        }
        
        // Ensure URL is absolute
        if (articleUrl && !articleUrl.startsWith('http')) {
          articleUrl = `https://${articleUrl}`;
        }

        // Extract summary from multiple possible fields
        let summary = article.summary || article.description || article.excerpt || article.snippet || article.text || '';
        
        // If no summary, use title as a fallback summary
        if (!summary || summary.trim() === '') {
          summary = article.title 
            ? `News article about ${article.title.toLowerCase()}. Click to read more.`
            : 'Financial news article. Click to read more.';
        }

        return {
          title: article.title || "Untitled Article",
          summary: summary,
          source: article.publisher || article.source || article.provider?.name || "Yahoo Finance",
          url: articleUrl,
          publishedAt: formattedDate,
          relevance: enhancement.relevance,
          relatedStocks: enhancement.relatedStocks.length > 0 
            ? enhancement.relatedStocks 
            : (article.relatedTicker ? [article.relatedTicker] : []),
        };
      });

    // Safety check: if filtering removed all articles, return at least the top 5 most recent
    // This prevents showing no articles when filtering is too aggressive
    if (articles.length === 0 && recentNews.length > 0) {
      console.warn("All articles were filtered out, returning top 5 most recent articles");
      articles = recentNews.slice(0, 5).map((article) => {
        const publishTime = article.providerPublishTime || article.pubDate || Date.now() / 1000;
        const publishDate = new Date((publishTime > 1e12 ? publishTime / 1000 : publishTime) * 1000);
        const formattedDate = publishDate.toISOString().split('T')[0];
        const articleUrl = article.link || article.url || `https://finance.yahoo.com/news/${article.uuid || ''}`;
        const summary = article.summary || article.description || article.excerpt || '';
        
        return {
          title: article.title || "Untitled Article",
          summary: summary || `News article about ${article.relatedTicker || 'the market'}`,
          source: article.publisher || article.source || "Yahoo Finance",
          url: articleUrl,
          publishedAt: formattedDate,
          relevance: `Recent news about ${article.relatedTicker || 'the market'}`,
          relatedStocks: article.relatedTicker ? [article.relatedTicker] : [],
        };
      });
    }

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch news" },
      { status: 500 }
    );
  }
}
