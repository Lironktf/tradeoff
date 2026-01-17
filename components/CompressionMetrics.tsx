"use client";

interface CompressionMetricsProps {
  compression: {
    originalTokens: number;
    compressedTokens: number;
    savings: number;
  };
}

export function CompressionMetrics({ compression }: CompressionMetricsProps) {
  const { originalTokens, compressedTokens, savings } = compression;

  // Rough cost estimate: $0.01 per 1K tokens (conservative)
  const originalCost = (originalTokens / 1000) * 0.01;
  const compressedCost = (compressedTokens / 1000) * 0.01;
  const costSaved = originalCost - compressedCost;

  return (
    <div className="border-t border-border pt-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Compression:</span>
        <span className="font-mono text-foreground">
          {originalTokens.toLocaleString()}
        </span>
        <span>→</span>
        <span className="font-mono text-accent">
          {compressedTokens.toLocaleString()}
        </span>
        <span>tokens</span>
        <span className="text-accent font-medium">
          ({Math.round(savings)}% saved)
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Estimated cost: ${originalCost.toFixed(2)} → ${compressedCost.toFixed(2)}{" "}
        <span className="text-accent">(${costSaved.toFixed(2)} saved)</span>
      </div>
    </div>
  );
}
