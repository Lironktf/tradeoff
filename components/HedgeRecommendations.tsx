"use client";

import { HedgeCard } from "@/components/HedgeCard";
import type { HedgeRecommendation } from "@/app/page";

interface HedgeRecommendationsProps {
  summary: string;
  recommendations: HedgeRecommendation[];
}

export function HedgeRecommendations({
  summary,
  recommendations,
}: HedgeRecommendationsProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <p className="text-muted-foreground leading-relaxed">{summary}</p>

      {/* Recommendation Cards */}
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <HedgeCard key={index} recommendation={rec} />
        ))}
      </div>

      {recommendations.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No hedge recommendations found for your portfolio.
        </p>
      )}
    </div>
  );
}
