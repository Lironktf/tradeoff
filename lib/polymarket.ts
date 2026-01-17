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
    const response = await fetch(
      `${GAMMA_API_BASE}/events?closed=false&limit=${limit}&active=true`,
      {
        headers: {
          "Accept": "application/json",
        },
        next: { revalidate: 60 },
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

// Format events for LLM context - include the slug so LLM can reference it
export function formatEventsForContext(events: PolymarketEvent[]): string {
  return events
    .filter((e) => e.title && e.slug)
    .map((e) => {
      // Get the main market probability if available
      const mainMarket = e.markets[0];
      const prob = mainMarket?.outcomePrices?.[0];
      const probStr = prob ? ` (${Math.round(prob * 100)}% YES)` : "";
      
      return `- "${e.title}"${probStr} [slug: ${e.slug}]`;
    })
    .join("\n");
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
