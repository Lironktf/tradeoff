"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { HedgeRecommendation, StockInfo } from "@/app/page";

interface GreeksViewProps {
  recommendations: HedgeRecommendation[];
  stockInfo?: Record<string, StockInfo>;
  portfolioValue?: number;
}

export function GreeksView({ recommendations, stockInfo = {}, portfolioValue = 50000 }: GreeksViewProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [customShares, setCustomShares] = useState(100);
  const [customDays, setCustomDays] = useState(30);
  const [showEducation, setShowEducation] = useState(true);

  // No recommendations yet
  if (recommendations.length === 0) {
    return (
      <div className="space-y-6">
        {/* Education for newcomers */}
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-3">New to Prediction Markets?</h2>
            <p className="text-muted-foreground mb-4">
              Prediction markets let you bet on future events. Unlike stocks, you&apos;re not buying 
              ownership—you&apos;re betting on outcomes like &quot;Will X happen by Y date?&quot;
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="font-medium text-foreground mb-1">📈 Stocks</p>
                <p className="text-muted-foreground">You own a piece of a company. Value goes up if company does well.</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="font-medium text-foreground mb-1">🎯 Prediction Markets</p>
                <p className="text-muted-foreground">You bet on outcomes. Win if your prediction is correct, lose if wrong.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Positions to Analyze</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Go to the <span className="text-accent font-medium">Hedges</span> tab first to find 
            Polymarket bets that hedge your stock portfolio.
          </p>
        </div>
      </div>
    );
  }

  const selected = recommendations[selectedIdx];
  const entryPrice = selected.position === "YES" ? selected.probability : (1 - selected.probability);
  const shares = customShares;
  const cost = shares * entryPrice;

  // Calculate metrics
  const maxProfit = shares * (1 - entryPrice);
  const maxLoss = cost;
  const breakeven = entryPrice * 100;
  const returnOnWin = ((maxProfit / cost) * 100);

  // What % of portfolio does this hedge cost?
  const hedgeCostPercent = (cost / portfolioValue) * 100;
  
  // Estimate what % of portfolio loss this could offset
  const potentialOffset = (maxProfit / portfolioValue) * 100;

  // P&L at different probability outcomes
  const scenarios = [
    { label: "10%", prob: 0.1 },
    { label: "25%", prob: 0.25 },
    { label: "40%", prob: 0.4 },
    { label: "50%", prob: 0.5 },
    { label: "60%", prob: 0.6 },
    { label: "75%", prob: 0.75 },
    { label: "90%", prob: 0.9 },
  ];

  const pnlScenarios = scenarios.map(s => {
    const exitPrice = selected.position === "YES" ? s.prob : (1 - s.prob);
    const pnl = shares * (exitPrice - entryPrice);
    return { ...s, pnl };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Position Analyzer</h2>
        <p className="text-muted-foreground">
          Understand the risk and reward before you bet on Polymarket.
        </p>
      </div>

      {/* Education Toggle */}
      {showEducation && (
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold">How Prediction Markets Work</h3>
              <button 
                onClick={() => setShowEducation(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Hide
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <span className="text-green-400 font-bold">$</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Prices = Probabilities</p>
                  <p className="text-muted-foreground">
                    If &quot;YES&quot; costs 43¢, the market thinks there&apos;s a 43% chance it happens. 
                    If you think it&apos;s higher, you might profit.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <span className="text-accent font-bold">✓</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">If You Win</p>
                  <p className="text-muted-foreground">
                    Each share pays out $1. So if you bought at 43¢, you profit 57¢ per share.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <span className="text-red-400 font-bold">✗</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">If You Lose</p>
                  <p className="text-muted-foreground">
                    Your shares become worthless. You lose what you paid (43¢ per share in this example).
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Position Selector */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-3">
            Select a hedge to analyze:
          </p>
          <div className="flex flex-wrap gap-2">
            {recommendations.map((rec, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  selectedIdx === idx
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                <span className={`font-medium ${rec.position === "YES" ? "text-green-400" : "text-red-400"}`}>
                  {rec.position}
                </span>
                {" "}on {rec.outcome?.slice(0, 25) || rec.market.slice(0, 25)}...
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Position Details */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Market:</p>
            <p className="font-medium">{selected.market}</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Your bet:</span>
            <span className={`px-2 py-1 rounded font-medium ${
              selected.position === "YES" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}>
              {selected.position} on &quot;{selected.outcome}&quot;
            </span>
            <span className="text-muted-foreground">@ {Math.round(entryPrice * 100)}¢ per share</span>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Shares</label>
              <Input
                type="number"
                value={customShares}
                onChange={(e) => setCustomShares(Number(e.target.value) || 100)}
                className="w-full"
                min={1}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Days to resolution</label>
              <Input
                type="number"
                value={customDays}
                onChange={(e) => setCustomDays(Number(e.target.value) || 30)}
                className="w-full"
                min={1}
              />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Total cost</p>
              <p className="text-2xl font-mono font-semibold">${cost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {hedgeCostPercent.toFixed(2)}% of portfolio
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk vs Reward - The Key Insight */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card border-border border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <h3 className="font-medium mb-3 text-green-400">If Your Prediction is Right</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You win:</span>
                <span className="font-mono font-semibold text-green-400">+${maxProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Return:</span>
                <span className="font-mono">{returnOnWin.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Could offset:</span>
                <span className="font-mono">{potentialOffset.toFixed(1)}% portfolio loss</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-l-4 border-l-red-500">
          <CardContent className="p-5">
            <h3 className="font-medium mb-3 text-red-400">If Your Prediction is Wrong</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You lose:</span>
                <span className="font-mono font-semibold text-red-400">-${maxLoss.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Of your bet:</span>
                <span className="font-mono">100%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Of portfolio:</span>
                <span className="font-mono">{hedgeCostPercent.toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakeven Explanation */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <h3 className="font-medium mb-2">Breakeven Point</h3>
          <p className="text-muted-foreground text-sm mb-3">
            You paid {Math.round(entryPrice * 100)}¢ per share. For you to profit if you sell before resolution, 
            the market price needs to be <span className="text-foreground font-medium">above {breakeven.toFixed(0)}%</span>.
          </p>
          
          <div className="h-4 bg-secondary rounded-full relative overflow-hidden">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-red-500 to-yellow-500"
              style={{ width: `${breakeven}%` }}
            />
            <div 
              className="absolute top-0 bottom-0 bg-gradient-to-r from-yellow-500 to-green-500"
              style={{ left: `${breakeven}%`, right: 0 }}
            />
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white"
              style={{ left: `${breakeven}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0% (lose all)</span>
            <span className="font-medium text-foreground">{breakeven.toFixed(0)}% breakeven</span>
            <span>100% (max win)</span>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Chart */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <h3 className="font-medium mb-2">What if the probability changes?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you sell before resolution, here&apos;s your P&L at different market prices:
          </p>
          
          <div className="space-y-2">
            {pnlScenarios.map((scenario) => {
              const isCurrentPrice = Math.abs(scenario.prob - selected.probability) < 0.05;
              const maxPnl = Math.max(...pnlScenarios.map(s => Math.abs(s.pnl)));
              const barWidth = maxPnl > 0 ? (Math.abs(scenario.pnl) / maxPnl) * 100 : 0;
              
              return (
                <div key={scenario.label} className="flex items-center gap-3">
                  <span className={`w-12 text-sm font-mono ${isCurrentPrice ? "text-accent font-bold" : "text-muted-foreground"}`}>
                    {scenario.label}
                  </span>
                  <div className="flex-1 h-7 bg-secondary/30 rounded relative overflow-hidden">
                    {scenario.pnl >= 0 ? (
                      <div 
                        className="absolute left-1/2 top-0 bottom-0 bg-green-500/50 rounded-r"
                        style={{ width: `${barWidth / 2}%` }}
                      />
                    ) : (
                      <div 
                        className="absolute right-1/2 top-0 bottom-0 bg-red-500/50 rounded-l"
                        style={{ width: `${barWidth / 2}%` }}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-mono font-medium ${
                        scenario.pnl >= 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {scenario.pnl >= 0 ? "+" : ""}${scenario.pnl.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  {isCurrentPrice && (
                    <span className="text-xs text-accent w-12">← now</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* The Hedge Insight */}
      <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
        <CardContent className="p-5">
          <h3 className="font-medium mb-2">💡 Why This is a Hedge</h3>
          <p className="text-sm text-muted-foreground">
            {selected.reasoning}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <strong className="text-foreground">The idea:</strong> If the event happens and hurts your stocks, 
            your Polymarket bet pays out, offsetting some of the loss.
          </p>
        </CardContent>
      </Card>

      {!showEducation && (
        <button 
          onClick={() => setShowEducation(true)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Show prediction market basics
        </button>
      )}
    </div>
  );
}
