"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PortfolioItem } from "@/app/page";

interface PortfolioInputProps {
  portfolio: PortfolioItem[];
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioItem[]>>;
  compact?: boolean;
}

// Generate a simple user ID for this session
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const DEMO_PORTFOLIOS = {
  tech: [
    { ticker: "NVDA", shares: 50 },
    { ticker: "MSFT", shares: 30 },
    { ticker: "GOOGL", shares: 20 },
    { ticker: "TSLA", shares: 25 },
    { ticker: "META", shares: 15 },
  ],
  crypto: [
    { ticker: "COIN", shares: 40 },
    { ticker: "MSTR", shares: 20 },
    { ticker: "SQ", shares: 35 },
    { ticker: "PYPL", shares: 30 },
  ],
  diversified: [
    { ticker: "AAPL", shares: 50 },
    { ticker: "JPM", shares: 25 },
    { ticker: "XOM", shares: 30 },
    { ticker: "JNJ", shares: 20 },
    { ticker: "NVDA", shares: 15 },
  ],
};

// Common column names for ticker/symbol
const TICKER_COLUMNS = ["symbol", "ticker", "stock", "name", "security", "holding", "asset"];
// Common column names for quantity/shares
const SHARES_COLUMNS = ["shares", "quantity", "qty", "units", "amount", "position", "holdings"];

function parsePortfolioData(text: string): PortfolioItem[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const items: PortfolioItem[] = [];
  
  // Detect delimiter (comma, tab, or multiple spaces)
  const firstLine = lines[0];
  let delimiter: string | RegExp = ",";
  if (firstLine.includes("\t")) {
    delimiter = "\t";
  } else if (!firstLine.includes(",") && firstLine.includes("  ")) {
    delimiter = /\s{2,}/;
  }

  // Split all lines
  const rows = lines.map(line => {
    if (typeof delimiter === "string") {
      return line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ""));
    }
    return line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ""));
  });

  // Try to detect header row and column indices
  let tickerCol = -1;
  let sharesCol = -1;
  let startRow = 0;

  // Check if first row is a header
  const headerRow = rows[0].map(h => h.toLowerCase());
  
  for (let i = 0; i < headerRow.length; i++) {
    const header = headerRow[i];
    if (tickerCol === -1 && TICKER_COLUMNS.some(t => header.includes(t))) {
      tickerCol = i;
    }
    if (sharesCol === -1 && SHARES_COLUMNS.some(s => header.includes(s))) {
      sharesCol = i;
    }
  }

  // If we found headers, skip the header row
  if (tickerCol !== -1 || sharesCol !== -1) {
    startRow = 1;
  }

  // If no headers detected, assume first column is ticker, second is shares
  if (tickerCol === -1) tickerCol = 0;
  if (sharesCol === -1) sharesCol = 1;

  // Parse data rows
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    const ticker = row[tickerCol]?.toUpperCase().replace(/[^A-Z]/g, "");
    const sharesStr = row[sharesCol]?.replace(/[,$]/g, "");
    const shares = parseFloat(sharesStr);

    // Validate: ticker should be 1-5 uppercase letters, shares should be positive
    if (ticker && ticker.length >= 1 && ticker.length <= 5 && !isNaN(shares) && shares > 0) {
      // Round shares to whole number
      items.push({ ticker, shares: Math.round(shares) });
    }
  }

  // Deduplicate by ticker (sum shares)
  const deduped = new Map<string, number>();
  for (const item of items) {
    deduped.set(item.ticker, (deduped.get(item.ticker) || 0) + item.shares);
  }

  return Array.from(deduped.entries()).map(([ticker, shares]) => ({ ticker, shares }));
}

export function PortfolioInput({
  portfolio,
  setPortfolio,
  compact = false,
}: PortfolioInputProps) {
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Broker connection state
  const [isConnectingBroker, setIsConnectingBroker] = useState(false);
  const [brokerError, setBrokerError] = useState<string | null>(null);
  const [brokerConnected, setBrokerConnected] = useState(false);

  // Check for brokerage callback on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isCallback = params.get("brokerage_callback") === "true";
    const status = params.get("status")?.toLowerCase();
    
    if (isCallback) {
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
      
      console.log("[Broker Callback] Status:", status);
      
      if (status === "success") {
        // Fetch holdings from connected broker
        fetchBrokerHoldings();
      } else {
        const error = params.get("error") || `Connection ${status || "failed"}`;
        setBrokerError(error);
      }
    }
    
    // Check if already connected
    const userId = localStorage.getItem("snaptrade_user_id");
    const userSecret = localStorage.getItem("snaptrade_user_secret");
    if (userId && userSecret) {
      setBrokerConnected(true);
    }
  }, []);

  const fetchBrokerHoldings = async () => {
    const userId = localStorage.getItem("snaptrade_user_id");
    const userSecret = localStorage.getItem("snaptrade_user_secret");
    
    if (!userId || !userSecret) {
      setBrokerError("Missing broker credentials");
      return;
    }

    try {
      setIsConnectingBroker(true);
      setBrokerError(null);
      
      const response = await fetch("/api/brokerage/snaptrade/holdings", {
        headers: {
          "x-snaptrade-user-id": userId,
          "x-snaptrade-user-secret": userSecret,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch holdings");
      }

      const data = await response.json();
      
      if (data.holdings && data.holdings.length > 0) {
        const portfolioItems: PortfolioItem[] = data.holdings.map((h: { ticker: string; shares: number }) => ({
          ticker: h.ticker,
          shares: Math.round(h.shares),
        }));
        setPortfolio(portfolioItems);
        setBrokerConnected(true);
      } else {
        setBrokerError("No holdings found in connected account");
      }
    } catch (err) {
      setBrokerError(err instanceof Error ? err.message : "Failed to fetch holdings");
    } finally {
      setIsConnectingBroker(false);
    }
  };

  const handleConnectBroker = async (forceNew = false) => {
    try {
      setIsConnectingBroker(true);
      setBrokerError(null);
      
      // Check for existing credentials or generate new user ID
      let userId = forceNew ? null : localStorage.getItem("snaptrade_user_id");
      let userSecret = forceNew ? null : localStorage.getItem("snaptrade_user_secret");
      
      if (!userId) {
        // Clear any stale credentials
        localStorage.removeItem("snaptrade_user_id");
        localStorage.removeItem("snaptrade_user_secret");
        userId = generateUserId();
        userSecret = null;
      }

      const response = await fetch("/api/brokerage/snaptrade/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userSecret,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        
        // If credentials are invalid, clear them and retry with fresh registration
        if (data.code === "INVALID_CREDENTIALS" && !forceNew) {
          console.log("Stale credentials, retrying with fresh registration...");
          localStorage.removeItem("snaptrade_user_id");
          localStorage.removeItem("snaptrade_user_secret");
          return handleConnectBroker(true);
        }
        
        throw new Error(data.error || "Failed to initialize connection");
      }

      const data = await response.json();
      
      // Store credentials for after OAuth callback
      localStorage.setItem("snaptrade_user_id", data.userId);
      localStorage.setItem("snaptrade_user_secret", data.userSecret);
      
      // Redirect to SnapTrade OAuth
      window.location.href = data.redirectUrl;
    } catch (err) {
      setBrokerError(err instanceof Error ? err.message : "Failed to connect broker");
      setIsConnectingBroker(false);
    }
  };

  const handleRefreshHoldings = async () => {
    await fetchBrokerHoldings();
  };

  const handleAdd = () => {
    if (!ticker.trim() || !shares.trim()) return;

    const tickerUpper = ticker.trim().toUpperCase();
    const sharesNum = parseInt(shares, 10);

    if (isNaN(sharesNum) || sharesNum <= 0) return;

    const existingIndex = portfolio.findIndex((p) => p.ticker === tickerUpper);
    if (existingIndex >= 0) {
      setPortfolio((prev) =>
        prev.map((p, i) =>
          i === existingIndex ? { ...p, shares: p.shares + sharesNum } : p
        )
      );
    } else {
      setPortfolio((prev) => [...prev, { ticker: tickerUpper, shares: sharesNum }]);
    }

    setTicker("");
    setShares("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const loadDemo = (type: keyof typeof DEMO_PORTFOLIOS) => {
    setPortfolio(DEMO_PORTFOLIOS[type]);
  };

  const handleImport = () => {
    setImportError(null);
    const items = parsePortfolioData(importText);
    
    if (items.length === 0) {
      setImportError("Could not parse any valid stocks. Make sure format is: TICKER, SHARES");
      return;
    }

    setPortfolio(items);
    setImportText("");
    setShowImport(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportError(null);
        const items = parsePortfolioData(text);
        
        if (items.length === 0) {
          setImportError("Could not parse any valid stocks from file.");
          return;
        }

        setPortfolio(items);
        setShowImport(false);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Compact mode - just show add form and import button (no analyze)
  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="text"
            placeholder="Add ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-32 font-mono uppercase"
          />
          <Input
            type="number"
            placeholder="Shares"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-24"
            min="1"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAdd}
            disabled={!ticker.trim() || !shares.trim()}
          >
            Add
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImport(!showImport)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showImport ? "Cancel" : "Import"}
          </Button>
          {brokerConnected ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshHoldings}
              disabled={isConnectingBroker}
              className="text-muted-foreground hover:text-foreground gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {isConnectingBroker ? "Syncing..." : "Sync Broker"}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleConnectBroker}
              disabled={isConnectingBroker}
              className="text-muted-foreground hover:text-foreground"
            >
              {isConnectingBroker ? "..." : "Connect Broker"}
            </Button>
          )}
        </div>
        {brokerError && (
          <p className="text-sm text-destructive">{brokerError}</p>
        )}

        {/* Import Section - Inline */}
        {showImport && (
          <div className="space-y-4 p-4 bg-secondary/50 rounded-lg border border-border">
            <p className="text-sm font-medium">Import Portfolio (replaces current)</p>
            
            {/* File Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
                id="portfolio-file-compact"
              />
              <label
                htmlFor="portfolio-file-compact"
                className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-md cursor-pointer hover:bg-secondary transition-colors text-sm"
              >
                <span>Upload CSV</span>
                <span className="text-muted-foreground text-xs">(Fidelity, Schwab, Robinhood, etc.)</span>
              </label>
            </div>

            {/* Paste Area */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Or paste your holdings:
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`Symbol, Shares
NVDA, 50
MSFT, 30`}
                className="w-full h-24 px-3 py-2 bg-background border border-border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {importError && (
              <p className="text-sm text-destructive">{importError}</p>
            )}

            <Button size="sm" onClick={handleImport} disabled={!importText.trim()}>
              Import & Replace
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connect Broker - Primary CTA */}
      {portfolio.length === 0 && (
        <div className="space-y-6">
          {/* Broker Connection */}
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connect Your Brokerage</p>
                <p className="text-sm text-muted-foreground">
                  Import your real portfolio from Fidelity, Schwab, Robinhood & more
                </p>
              </div>
              <Button
                onClick={handleConnectBroker}
                disabled={isConnectingBroker}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isConnectingBroker ? "Connecting..." : "Connect Broker"}
              </Button>
            </div>
            {brokerError && (
              <p className="text-sm text-destructive mt-2">{brokerError}</p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or try a demo</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Demo Portfolios */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadDemo("tech")}
                className="text-xs"
              >
                Tech Heavy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadDemo("crypto")}
                className="text-xs"
              >
                Crypto Exposure
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadDemo("diversified")}
                className="text-xs"
              >
                Diversified
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImport(!showImport)}
                className="text-xs"
              >
                Import CSV
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Broker Refresh - When connected and has portfolio */}
      {portfolio.length > 0 && brokerConnected && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>Broker connected</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshHoldings}
            disabled={isConnectingBroker}
            className="text-xs"
          >
            {isConnectingBroker ? "Syncing..." : "Sync"}
          </Button>
        </div>
      )}

      {/* Import Section */}
      {showImport && (
        <div className="space-y-4 p-4 bg-secondary/50 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Import Portfolio</p>
            <button
              onClick={() => {
                setShowImport(false);
                setImportText("");
                setImportError(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
          
          {/* File Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.tsv"
              onChange={handleFileUpload}
              className="hidden"
              id="portfolio-file"
            />
            <label
              htmlFor="portfolio-file"
              className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-md cursor-pointer hover:bg-secondary transition-colors text-sm"
            >
              <span>Upload CSV</span>
              <span className="text-muted-foreground text-xs">(from Fidelity, Schwab, Robinhood, etc.)</span>
            </label>
          </div>

          {/* Paste Area */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Or paste your holdings (supports most formats):
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Symbol, Shares
NVDA, 50
MSFT, 30
GOOGL, 20

Or paste directly from your broker...`}
              className="w-full h-32 px-3 py-2 bg-background border border-border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {importError && (
            <p className="text-sm text-destructive">{importError}</p>
          )}

          <Button size="sm" onClick={handleImport} disabled={!importText.trim()}>
            Import
          </Button>
        </div>
      )}

      {/* Add Stock Form */}
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="Ticker (e.g. NVDA)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-40 font-mono uppercase"
        />
        <Input
          type="number"
          placeholder="Shares"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-28"
          min="1"
        />
        <Button
          variant="secondary"
          onClick={handleAdd}
          disabled={!ticker.trim() || !shares.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
