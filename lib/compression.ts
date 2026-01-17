export interface CompressionResult {
  compressed: string;
  originalTokens: number;
  compressedTokens: number;
  savings: number;
}

const TOKEN_COMPANY_API = "https://api.thetokencompany.ai/v1/compress";

// Simple token estimation (roughly 4 chars per token)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function compressWithBear1(
  text: string,
  apiKey: string
): Promise<CompressionResult> {
  const originalTokens = estimateTokens(text);

  try {
    const response = await fetch(TOKEN_COMPANY_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text,
        model: "bear-1",
      }),
    });

    if (!response.ok) {
      // If compression fails, return original text
      console.error("Compression API error:", response.status);
      return {
        compressed: text,
        originalTokens,
        compressedTokens: originalTokens,
        savings: 0,
      };
    }

    const data = await response.json();
    const compressed = data.compressed || data.text || text;
    const compressedTokens = estimateTokens(compressed);
    const savings = ((originalTokens - compressedTokens) / originalTokens) * 100;

    return {
      compressed,
      originalTokens,
      compressedTokens,
      savings: Math.max(0, savings),
    };
  } catch (error) {
    console.error("Compression error:", error);
    return {
      compressed: text,
      originalTokens,
      compressedTokens: originalTokens,
      savings: 0,
    };
  }
}

export function buildContextForAnalysis(
  portfolioData: { ticker: string; sector: string; industry: string; shares: number }[],
  eventsContext: string
): string {
  const portfolioContext = portfolioData
    .map((p) => `${p.ticker} (${p.shares} shares) - Sector: ${p.sector}, Industry: ${p.industry}`)
    .join("\n");

  return `
## User's Stock Portfolio
${portfolioContext}

## Active Polymarket Events
Each event is listed with its title and slug. Use the exact event title in your recommendations.
${eventsContext}
`.trim();
}
