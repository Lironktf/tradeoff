export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  endDate: string;
  volume: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  markets: PolymarketMarket[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  outcomePrices: number[];
  volume: number;
}

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

export async function fetchActiveEvents(limit: number = 50): Promise<PolymarketEvent[]> {
  try {
    // Fetch from events endpoint - gives us proper event slugs
    // Disable caching for large responses (>2MB) to avoid Next.js cache errors
    const response = await fetch(
      `${GAMMA_API_BASE}/events?closed=false&limit=${limit}&active=true`,
      {
        headers: {
          "Accept": "application/json",
        },
        cache: 'no-store', // Disable caching to avoid "items over 2MB" error
      }
    );

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.map((event: Record<string, unknown>) => ({
      id: event.id || "",
      title: event.title || "",
      slug: event.slug || "",
      description: event.description || "",
      endDate: event.endDate || "",
      volume: parseFloat(String(event.volume)) || 0,
      liquidity: parseFloat(String(event.liquidity)) || 0,
      active: event.active !== false,
      closed: event.closed === true,
      markets: parseMarkets(event.markets),
    }));
  } catch (error) {
    console.error("Error fetching Polymarket events:", error);
    return [];
  }
}

// Search events by text query
export async function searchEvents(query: string, limit: number = 20): Promise<PolymarketEvent[]> {
  try {
    const response = await fetch(
      `${GAMMA_API_BASE}/events?closed=false&limit=${limit}&active=true&title_contains=${encodeURIComponent(query)}`,
      {
        headers: { "Accept": "application/json" },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    return data.map((event: Record<string, unknown>) => ({
      id: event.id || "",
      title: event.title || "",
      slug: event.slug || "",
      description: event.description || "",
      endDate: event.endDate || "",
      volume: parseFloat(String(event.volume)) || 0,
      liquidity: parseFloat(String(event.liquidity)) || 0,
      active: event.active !== false,
      closed: event.closed === true,
      markets: parseMarkets(event.markets),
    }));
  } catch (error) {
    console.error(`Error searching events for "${query}":`, error);
    return [];
  }
}

// Get company-specific search keywords
export function getCompanyKeywords(ticker: string, company: string, sector: string, industry: string): string[] {
  const keywords: string[] = [];
  
  // Company-specific keywords based on ticker
  const companyKeywordMap: Record<string, string[]> = {
    // Tech giants
    NVDA: ["nvidia", "gpu", "ai chip", "semiconductor", "jensen", "cuda", "data center", "gaming"],
    MSFT: ["microsoft", "azure", "windows", "copilot", "openai", "satya", "xbox", "activision"],
    GOOGL: ["google", "alphabet", "search", "youtube", "android", "gemini", "waymo", "antitrust"],
    GOOG: ["google", "alphabet", "search", "youtube", "android", "gemini", "waymo", "antitrust"],
    META: ["meta", "facebook", "instagram", "whatsapp", "zuckerberg", "metaverse", "threads", "social media"],
    AAPL: ["apple", "iphone", "mac", "tim cook", "app store", "vision pro", "ios"],
    AMZN: ["amazon", "aws", "prime", "alexa", "bezos", "jassy", "e-commerce"],
    TSLA: ["tesla", "ev", "electric vehicle", "musk", "elon", "autopilot", "cybertruck", "spacex"],
    
    // Crypto-related
    COIN: ["coinbase", "crypto", "bitcoin", "ethereum", "cryptocurrency", "sec crypto"],
    MSTR: ["microstrategy", "bitcoin", "saylor", "btc treasury"],
    SQ: ["square", "block", "cash app", "bitcoin", "jack dorsey"],
    PYPL: ["paypal", "venmo", "crypto", "digital payments"],
    
    // Finance
    JPM: ["jpmorgan", "jamie dimon", "banking", "interest rate", "fed", "recession"],
    GS: ["goldman sachs", "banking", "wall street", "fed", "interest rate"],
    BAC: ["bank of america", "banking", "interest rate", "fed"],
    
    // Energy
    XOM: ["exxon", "oil", "energy", "gas", "opec", "oil price", "drilling"],
    CVX: ["chevron", "oil", "energy", "gas", "opec"],
    
    // Healthcare
    JNJ: ["johnson and johnson", "pharma", "vaccine", "fda"],
    PFE: ["pfizer", "pharma", "vaccine", "fda", "drug approval"],
    UNH: ["unitedhealth", "healthcare", "insurance", "medicare"],
    
    // Defense
    LMT: ["lockheed", "defense", "military", "pentagon", "f-35"],
    RTX: ["raytheon", "defense", "military", "missiles"],
    
    // AI/Tech
    AMD: ["amd", "cpu", "gpu", "ai chip", "lisa su", "semiconductor"],
    INTC: ["intel", "cpu", "semiconductor", "foundry", "pat gelsinger"],
    CRM: ["salesforce", "crm", "enterprise software", "marc benioff"],
    ORCL: ["oracle", "cloud", "database", "larry ellison"],
  };
  
  // Add ticker-specific keywords
  if (companyKeywordMap[ticker]) {
    keywords.push(...companyKeywordMap[ticker]);
  }
  
  // Add company name
  if (company && company.length > 2) {
    keywords.push(company.split(" ")[0].toLowerCase());
  }
  
  // Sector-specific keywords
  const sectorKeywordMap: Record<string, string[]> = {
    "Technology": ["tech", "ai", "regulation", "antitrust", "tariff"],
    "Communication Services": ["social media", "streaming", "content moderation", "regulation"],
    "Consumer Cyclical": ["consumer", "retail", "spending", "recession"],
    "Consumer Defensive": ["consumer", "inflation"],
    "Financial Services": ["banking", "interest rate", "fed", "recession", "regulation"],
    "Healthcare": ["fda", "drug", "medicare", "healthcare reform"],
    "Energy": ["oil", "gas", "opec", "drilling", "climate", "renewables"],
    "Industrials": ["manufacturing", "supply chain", "infrastructure", "tariff"],
    "Basic Materials": ["commodities", "mining", "tariff"],
    "Real Estate": ["housing", "interest rate", "commercial real estate"],
    "Utilities": ["energy", "regulation", "infrastructure"],
  };
  
  if (sectorKeywordMap[sector]) {
    keywords.push(...sectorKeywordMap[sector]);
  }
  
  // Industry-specific
  if (industry.toLowerCase().includes("semiconductor")) {
    keywords.push("chip", "semiconductor", "tsmc", "china export", "tariff");
  }
  if (industry.toLowerCase().includes("internet")) {
    keywords.push("internet", "regulation", "section 230");
  }
  if (industry.toLowerCase().includes("auto")) {
    keywords.push("ev", "electric vehicle", "autonomous", "uaw", "tariff");
  }
  
  return [...new Set(keywords)]; // Remove duplicates
}

// Fetch events relevant to a portfolio
export async function fetchRelevantEvents(
  stocks: { ticker: string; name: string; sector: string; industry: string }[]
): Promise<PolymarketEvent[]> {
  const allEvents: PolymarketEvent[] = [];
  const seenIds = new Set<string>();
  
  // Get base events
  const baseEvents = await fetchActiveEvents(100);
  for (const event of baseEvents) {
    if (!seenIds.has(event.id)) {
      seenIds.add(event.id);
      allEvents.push(event);
    }
  }
  
  // For each stock, search for relevant events
  for (const stock of stocks.slice(0, 5)) { // Limit to 5 to avoid too many requests
    const keywords = getCompanyKeywords(stock.ticker, stock.name, stock.sector, stock.industry);
    
    // Search for the most specific keywords first
    const searchTerms = [
      stock.ticker.toLowerCase(),
      stock.name.split(" ")[0].toLowerCase(),
      ...keywords.slice(0, 3),
    ].filter(k => k.length >= 3);
    
    for (const term of searchTerms.slice(0, 2)) { // 2 searches per stock max
      const events = await searchEvents(term, 10);
      for (const event of events) {
        if (!seenIds.has(event.id)) {
          seenIds.add(event.id);
          allEvents.push(event);
        }
      }
    }
  }
  
  // Sort by volume (most liquid first)
  return allEvents.sort((a, b) => b.volume - a.volume);
}

function parseMarkets(markets: unknown): PolymarketMarket[] {
  if (!Array.isArray(markets)) return [];
  
  return markets.map((m: Record<string, unknown>) => ({
    id: String(m.id || ""),
    question: String(m.question || ""),
    slug: String(m.slug || ""),
    outcomePrices: parseOutcomePrices(m.outcomePrices),
    volume: parseFloat(String(m.volume)) || 0,
  }));
}

function parseOutcomePrices(prices: unknown): number[] {
  if (!prices) return [];
  if (typeof prices === "string") {
    try {
      const parsed = JSON.parse(prices);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(prices)) {
    return prices.map(Number);
  }
  return [];
}

// Direct link to a specific event
export function getEventUrl(slug: string): string {
  return `https://polymarket.com/event/${slug}`;
}

// Format events for LLM context - group by relevance
export function formatEventsForContext(
  events: PolymarketEvent[],
  stocks?: { ticker: string; name: string; sector: string; industry: string }[]
): string {
  if (!stocks) {
    return events
      .filter((e) => e.title && e.slug)
      .slice(0, 50)
      .map((e) => {
        const mainMarket = e.markets[0];
        const prob = mainMarket?.outcomePrices?.[0];
        const probStr = prob ? ` (${Math.round(prob * 100)}% YES)` : "";
        return `- "${e.title}"${probStr} [slug: ${e.slug}]`;
      })
      .join("\n");
  }
  
  // Score events by relevance to stocks
  const scoredEvents = events.map(event => {
    let score = 0;
    const titleLower = event.title.toLowerCase();
    const matchedStocks: string[] = [];
    
    for (const stock of stocks) {
      const keywords = getCompanyKeywords(stock.ticker, stock.name, stock.sector, stock.industry);
      for (const keyword of keywords) {
        if (titleLower.includes(keyword.toLowerCase())) {
          score += 1;
          if (!matchedStocks.includes(stock.ticker)) {
            matchedStocks.push(stock.ticker);
          }
        }
      }
    }
    
    // Boost for volume
    if (event.volume > 100000) score += 2;
    if (event.volume > 1000000) score += 3;
    
    return { event, score, matchedStocks };
  });
  
  // Sort by score, take top results
  const sorted = scoredEvents.sort((a, b) => b.score - a.score);
  const relevant = sorted.filter(s => s.score > 0).slice(0, 25);
  const general = sorted.filter(s => s.score === 0).slice(0, 15);
  
  let result = "### Relevant to your portfolio:\n";
  result += relevant.map(({ event, matchedStocks }) => {
    const mainMarket = event.markets[0];
    const prob = mainMarket?.outcomePrices?.[0];
    const probStr = prob ? ` (${Math.round(prob * 100)}% YES)` : "";
    const stocksStr = matchedStocks.length > 0 ? ` [affects: ${matchedStocks.join(", ")}]` : "";
    return `- "${event.title}"${probStr}${stocksStr} [slug: ${event.slug}]`;
  }).join("\n");
  
  if (general.length > 0) {
    result += "\n\n### General markets:\n";
    result += general.map(({ event }) => {
      const mainMarket = event.markets[0];
      const prob = mainMarket?.outcomePrices?.[0];
      const probStr = prob ? ` (${Math.round(prob * 100)}% YES)` : "";
      return `- "${event.title}"${probStr} [slug: ${event.slug}]`;
    }).join("\n");
  }
  
  return result;
}

// Find event by matching title keywords
export function findEventByKeywords(
  events: PolymarketEvent[],
  keywords: string
): PolymarketEvent | null {
  const lowerKeywords = keywords.toLowerCase();
  const keywordList = lowerKeywords.split(/\s+/).filter(k => k.length > 2);
  
  // Score each event by how many keywords match
  let bestMatch: PolymarketEvent | null = null;
  let bestScore = 0;
  
  for (const event of events) {
    const titleLower = event.title.toLowerCase();
    let score = 0;
    
    for (const keyword of keywordList) {
      if (titleLower.includes(keyword)) {
        score++;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = event;
    }
  }
  
  return bestScore >= 1 ? bestMatch : null;
}

// Legacy function for backwards compatibility
export async function fetchActiveMarkets(limit: number = 100) {
  const events = await fetchActiveEvents(limit);
  // Flatten events to markets with event slug attached
  return events.flatMap(event => 
    event.markets.map(market => ({
      ...market,
      eventSlug: event.slug,
      eventTitle: event.title,
    }))
  );
}
