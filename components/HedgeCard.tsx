"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { HedgeRecommendation } from "@/app/page";

interface HedgeCardProps {
  recommendation: HedgeRecommendation;
}

export function HedgeCard({ recommendation }: HedgeCardProps) {
  const {
    market,
    marketUrl,
    probability,
    position,
    reasoning,
    hedgesAgainst,
    suggestedAllocation,
  } = recommendation;

  return (
    <Card className="bg-card border-border hover:border-accent/50 transition-colors">
      <CardContent className="p-6 space-y-4">
        {/* Market Title & Probability */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <a
              href={marketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-accent transition-colors font-medium group inline-flex items-center gap-1"
            >
              &ldquo;{market}&rdquo;
              <span className="text-muted-foreground group-hover:text-accent transition-colors">
                ↗
              </span>
            </a>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-semibold font-mono">
              {Math.round(probability * 100)}%
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                position === "YES"
                  ? "bg-accent/20 text-accent"
                  : "bg-destructive/20 text-destructive"
              }`}
            >
              {position}
            </span>
          </div>
        </div>

        {/* Reasoning */}
        <p className="text-muted-foreground text-sm leading-relaxed">
          {reasoning}
        </p>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Hedges against: </span>
            <span className="text-foreground">{hedgesAgainst}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Suggested allocation: </span>
            <span className="text-foreground font-mono">
              ${suggestedAllocation.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
