export interface HedgeRecommendation {
  market: string;
  marketUrl: string;
  probability: number;
  position: "YES" | "NO";
  reasoning: string;
  hedgesAgainst: string;
  suggestedAllocation: number;
}

export interface AnalysisResponse {
  summary: string;
  recommendations: HedgeRecommendation[];
}

// Groq API (not Grok from xAI)
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Models in order of preference (will fallback if rate limited)
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",      // Best quality
  "meta-llama/llama-4-scout-17b-16e-instruct", // High token limit
  "moonshotai/kimi-k2-instruct",  // Good alternative
  "qwen/qwen3-32b",               // Another option
  "llama-3.1-8b-instant",         // Fast fallback
];

const SYSTEM_PROMPT = `You are a financial analyst specializing in portfolio hedging using prediction markets. Your task is to analyze a user's stock portfolio and recommend Polymarket bets that could hedge their risk exposure.

For each recommendation, consider:
1. What risk does the stock portfolio face?
2. Which prediction market outcome would benefit if that risk materializes?
3. How strongly correlated is the hedge?

Respond with JSON in this exact format:
{
  "summary": "Brief analysis of the portfolio's main risk exposures",
  "recommendations": [
    {
      "market": "The exact market question",
      "probability": 0.52,
      "position": "YES",
      "reasoning": "Why this hedge makes sense",
      "hedgesAgainst": "The specific risk this addresses",
      "suggestedAllocation": 500
    }
  ]
}

Provide 2-4 recommendations. Be specific and actionable. Only output valid JSON, no markdown.`;

async function tryModel(
  model: string,
  context: string,
  apiKey: string
): Promise<AnalysisResponse | null> {
  try {
    console.log(`Trying model: ${model}`);
    
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyze this portfolio and recommend Polymarket hedges:\n\n${context}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (response.status === 429) {
      // Rate limited - try next model
      console.log(`Model ${model} rate limited`);
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error for ${model}:`, response.status, errorText);
      
      // If it's a model-specific error, try next model
      if (response.status === 400 || response.status === 404) {
        return null;
      }
      
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in Groq response");
    }

    // Parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Groq response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    console.log(`Success with model: ${model}`);
    
    return {
      summary: parsed.summary || "Analysis complete.",
      recommendations: (parsed.recommendations || []).map((rec: Record<string, unknown>) => ({
        market: rec.market || "",
        marketUrl: "", // Will be filled in by the caller
        probability: Number(rec.probability) || 0.5,
        position: rec.position === "NO" ? "NO" : "YES",
        reasoning: String(rec.reasoning || ""),
        hedgesAgainst: String(rec.hedgesAgainst || ""),
        suggestedAllocation: Number(rec.suggestedAllocation) || 100,
      })),
    };
  } catch (error) {
    console.error(`Error with model ${model}:`, error);
    return null;
  }
}

export async function analyzeWithGroq(
  context: string,
  apiKey: string
): Promise<AnalysisResponse> {
  // Try each model in order until one works
  for (const model of GROQ_MODELS) {
    const result = await tryModel(model, context, apiKey);
    if (result) {
      return result;
    }
  }

  throw new Error("All models failed or rate limited. Please try again later.");
}

// Keep old export name for backwards compatibility
export const analyzeWithGrok = analyzeWithGroq;
