"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import type { HedgeRecommendation, StockInfo } from "@/app/page";

interface GreeksViewProps {
  recommendations: HedgeRecommendation[];
  stockInfo?: Record<string, StockInfo>;
  portfolioValue?: number;
}

export function GreeksView({ recommendations, stockInfo = {}, portfolioValue = 50000 }: GreeksViewProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showEducation, setShowEducation] = useState(true);
  
  // Calculate default shares from the recommendation's suggested allocation
  const getDefaultShares = (rec: HedgeRecommendation): number => {
    const entryPrice = rec.position === "YES" ? rec.probability : (1 - rec.probability);
    if (entryPrice <= 0) return 100;
    // suggestedAllocation is in dollars, divide by entry price to get shares
    return Math.round(rec.suggestedAllocation / entryPrice);
  };
  
  const [customShares, setCustomShares] = useState(() => 
    recommendations.length > 0 ? getDefaultShares(recommendations[0]) : 100
  );
  
  // Update shares when selected hedge changes
  useEffect(() => {
    if (recommendations.length > 0 && recommendations[selectedIdx]) {
      setCustomShares(getDefaultShares(recommendations[selectedIdx]));
    }
  }, [selectedIdx, recommendations]);
  
  // Calculate days to resolution from endDate
  const calculateDaysToResolution = (endDate?: string): number => {
    if (!endDate) return 30; // Default fallback
    
    try {
      const end = new Date(endDate);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays); // Don't return negative days
    } catch {
      return 30; // Fallback if date parsing fails
    }
  };

  // Calculate the value of affected stocks for a recommendation
  const getAffectedStocksValue = (rec: HedgeRecommendation): number => {
    return rec.affectedStocks.reduce((sum, ticker) => {
      const info = stockInfo[ticker];
      if (!info) return sum;
      // We don't have share counts here, so estimate based on portfolio allocation
      // Assume equal distribution if we don't have specific data
      const estimatedValue = portfolioValue / Object.keys(stockInfo).length || 0;
      return sum + estimatedValue;
    }, 0);
  };

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
  const daysToResolution = calculateDaysToResolution(selected.endDate);

  // Calculate metrics
  const maxProfit = shares * (1 - entryPrice);
  const maxLoss = cost;
  const breakeven = entryPrice * 100;
  const returnOnWin = ((maxProfit / cost) * 100);

  // Calculate value of affected stocks (more relevant than total portfolio)
  const affectedStocksValue = getAffectedStocksValue(selected);
  
  // What % of affected stocks does this hedge cost?
  const hedgeCostPercent = affectedStocksValue > 0 ? (cost / affectedStocksValue) * 100 : 0;
  
  // Estimate what % of affected stocks loss this could offset
  const potentialOffset = affectedStocksValue > 0 ? (maxProfit / affectedStocksValue) * 100 : 0;
  
  // Format affected stocks list for display
  const affectedStocksList = selected.affectedStocks.join(", ");

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
      <Card className="bg-[#1c2026] border-[#2d3139]">
        <CardContent className="p-4">
          <p className="text-sm text-[#858687] mb-3">
            Select a hedge to analyze ({recommendations.length} available):
          </p>
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
            {recommendations.map((rec, idx) => {
              const isSelected = selectedIdx === idx;
              const isYes = rec.position === "YES";
              const selectedBg = isYes ? "bg-[#3fb950] border-[#3fb950]" : "bg-[#f85149] border-[#f85149]";
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full px-4 py-3 rounded-lg text-sm text-left transition-colors ${
                    isSelected
                      ? `${selectedBg} text-white border-2`
                      : "bg-[#252932] hover:bg-[#2d3139] text-white border border-[#2d3139]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-2 text-white">
                        {rec.market}
                      </p>
                      <p className={`text-xs mt-1 ${isSelected ? "text-white/80" : "text-[#858687]"}`}>
                        Hedges: {rec.affectedStocks.join(", ")}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-1 rounded text-xs font-bold ${
                      isYes 
                        ? isSelected ? "bg-white/20 text-white" : "bg-[rgba(63,185,80,0.2)] text-[#3fb950]"
                        : isSelected ? "bg-white/20 text-white" : "bg-[rgba(248,81,73,0.2)] text-[#f85149]"
                    }`}>
                      {rec.position}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Position Details */}
      <Card className="bg-[#1c2026] border-[#2d3139]">
        <CardContent className="p-5 space-y-4">
          <div>
            <p className="text-sm text-[#858687]">Market:</p>
            <p className="font-medium text-white">{selected.market}</p>
          </div>

          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-[#858687]">Your bet:</span>
            <span className={`px-2 py-1 rounded font-medium ${
              selected.position === "YES" ? "bg-[rgba(63,185,80,0.2)] text-[#3fb950]" : "bg-[rgba(248,81,73,0.2)] text-[#f85149]"
            }`}>
              {selected.position} on &quot;{selected.outcome}&quot;
            </span>
            <span className="text-[#858687]">@ {Math.round(entryPrice * 100)}¢ per share</span>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[#2d3139]">
            <div>
              <label className="text-xs text-[#858687] block mb-1">Shares</label>
              <Input
                type="number"
                value={customShares}
                onChange={(e) => setCustomShares(Number(e.target.value) || 100)}
                className="w-full"
                min={1}
              />
            </div>
            <div>
              <label className="text-xs text-[#858687] block mb-1">Days to resolution</label>
              <div className="w-full px-3 py-2 bg-[#252932] rounded border border-[#2d3139] text-white">
                {daysToResolution} {daysToResolution === 1 ? 'day' : 'days'}
              </div>
              {selected.endDate && (
                <p className="text-xs text-[#858687] mt-1">
                  Resolves: {new Date(selected.endDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-[#858687] mb-1">Total cost</p>
              <p className="text-2xl font-mono font-semibold text-white">${cost.toFixed(2)}</p>
              <p className="text-xs text-[#858687]">
                {hedgeCostPercent.toFixed(2)}% of portfolio
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk vs Reward - The Key Insight */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[#1c2026] border-[#2d3139] border-l-4 border-l-[#3fb950]">
          <CardContent className="p-5">
            <h3 className="font-medium mb-3 text-[#3fb950]">If Your Prediction is Right</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#858687]">You win:</span>
                <span className="font-mono font-semibold text-[#3fb950]">+${maxProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#858687]">Return:</span>
                <span className="font-mono text-white">{returnOnWin.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-[#858687]">Could offset:</span>
                <span className="font-mono text-white text-right">
                  {potentialOffset.toFixed(1)}% of {affectedStocksList}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1c2026] border-[#2d3139] border-l-4 border-l-[#f85149]">
          <CardContent className="p-5">
            <h3 className="font-medium mb-3 text-[#f85149]">If Your Prediction is Wrong</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#858687]">You lose:</span>
                <span className="font-mono font-semibold text-[#f85149]">-${maxLoss.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#858687]">Of your bet:</span>
                <span className="font-mono text-white">100%</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-[#858687]">Of {affectedStocksList}:</span>
                <span className="font-mono text-white">{hedgeCostPercent.toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakeven Explanation */}
      <Card className="bg-[#1c2026] border-[#2d3139]">
        <CardContent className="p-5">
          <h3 className="font-medium mb-2 text-white">Breakeven Point</h3>
          <p className="text-[#858687] text-sm mb-3">
            You paid {Math.round(entryPrice * 100)}¢ per share. For you to profit if you sell before resolution, 
            the market price needs to be <span className="text-white font-medium">above {breakeven.toFixed(0)}%</span>.
          </p>
          
          <div className="h-4 bg-[#252932] rounded-full relative overflow-hidden">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#f85149] to-[#f0883e]"
              style={{ width: `${breakeven}%` }}
            />
            <div 
              className="absolute top-0 bottom-0 bg-gradient-to-r from-[#f0883e] to-[#3fb950]"
              style={{ left: `${breakeven}%`, right: 0 }}
            />
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white"
              style={{ left: `${breakeven}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#858687] mt-1">
            <span>0% (lose all)</span>
            <span className="font-medium text-white">{breakeven.toFixed(0)}% breakeven</span>
            <span>100% (max win)</span>
          </div>
        </CardContent>
      </Card>

      {/* Payoff Curve Chart */}
      <Card className="bg-[#1c2026] border-[#2d3139]">
        <CardContent className="p-5">
          <h3 className="font-medium mb-2 text-white">Payoff Curve</h3>
          <p className="text-sm text-[#858687] mb-4">
            Your profit/loss as market probability changes (if you sell before resolution):
          </p>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pnlScenarios} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: '#858687', fontSize: 12 }}
                  axisLine={{ stroke: '#2d3139' }}
                  tickLine={{ stroke: '#2d3139' }}
                />
                <YAxis 
                  tick={{ fill: '#858687', fontSize: 12 }}
                  axisLine={{ stroke: '#2d3139' }}
                  tickLine={{ stroke: '#2d3139' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#1c2026] border border-[#2d3139] rounded-lg px-3 py-2 text-sm shadow-lg">
                          <p className="text-white font-medium">At {data.label} probability</p>
                          <p className={data.pnl >= 0 ? "text-[#3fb950]" : "text-[#f85149]"}>
                            P&L: {data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#2d3139" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#3fb950"
                  strokeWidth={2}
                  dot={{ fill: '#3fb950', strokeWidth: 0, r: 4 }}
                  activeDot={{ fill: '#3fb950', strokeWidth: 0, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Current position marker */}
          <div className="flex items-center justify-center gap-2 mt-4 text-sm">
            <div className="w-3 h-3 rounded-full bg-[#3fb950]" />
            <span className="text-[#858687]">
              Current: <span className="text-white font-medium">{Math.round(selected.probability * 100)}%</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Table */}
      <Card className="bg-[#1c2026] border-[#2d3139]">
        <CardContent className="p-5">
          <h3 className="font-medium mb-2 text-white">Scenario Analysis</h3>
          <p className="text-sm text-[#858687] mb-4">
            P&L at different market probabilities:
          </p>
          
          <div className="space-y-2">
            {pnlScenarios.map((scenario) => {
              const isCurrentPrice = Math.abs(scenario.prob - selected.probability) < 0.05;
              const maxPnl = Math.max(...pnlScenarios.map(s => Math.abs(s.pnl)));
              const barWidth = maxPnl > 0 ? (Math.abs(scenario.pnl) / maxPnl) * 100 : 0;
              
              return (
                <div key={scenario.label} className="flex items-center gap-3">
                  <span className={`w-12 text-sm font-mono ${isCurrentPrice ? "text-[#3fb950] font-bold" : "text-[#858687]"}`}>
                    {scenario.label}
                  </span>
                  <div className="flex-1 h-7 bg-[#252932] rounded relative overflow-hidden">
                    {scenario.pnl >= 0 ? (
                      <div 
                        className="absolute left-1/2 top-0 bottom-0 bg-[rgba(63,185,80,0.3)] rounded-r"
                        style={{ width: `${barWidth / 2}%` }}
                      />
                    ) : (
                      <div 
                        className="absolute right-1/2 top-0 bottom-0 bg-[rgba(248,81,73,0.3)] rounded-l"
                        style={{ width: `${barWidth / 2}%` }}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-mono font-medium ${
                        scenario.pnl >= 0 ? "text-[#3fb950]" : "text-[#f85149]"
                      }`}>
                        {scenario.pnl >= 0 ? "+" : ""}${scenario.pnl.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  {isCurrentPrice && (
                    <span className="text-xs text-[#3fb950] w-16">← current</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* The Hedge Insight */}
      <Card className="bg-gradient-to-br from-[rgba(63,185,80,0.1)] to-transparent border-[rgba(63,185,80,0.3)]">
        <CardContent className="p-5">
          <h3 className="font-medium mb-2 text-white">💡 Why This is a Hedge</h3>
          <p className="text-sm text-[#858687]">
            {selected.reasoning}
          </p>
          <p className="text-sm text-[#858687] mt-2">
            <strong className="text-white">The idea:</strong> If the event happens and hurts your stocks, 
            your Polymarket bet pays out, offsetting some of the loss.
          </p>
        </CardContent>
      </Card>

      {!showEducation && (
        <button 
          onClick={() => setShowEducation(true)}
          className="text-sm text-[#858687] hover:text-white transition-colors"
        >
          Show prediction market basics
        </button>
      )}
    </div>
  );
}
