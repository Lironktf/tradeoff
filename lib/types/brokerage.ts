/**
 * Brokerage Integration Types
 * 
 * Type definitions for SnapTrade integration and CSV parsing
 */

// ============================================================================
// Core Portfolio Types (compatible with existing PortfolioItem)
// ============================================================================

export interface PortfolioHolding {
  ticker: string;
  shares: number;
  // Extended fields from brokerage data
  costBasis?: number;
  currentValue?: number;
  averagePrice?: number;
  currency?: string;
}

// ============================================================================
// SnapTrade Types
// ============================================================================

export interface SnapTradeConfig {
  clientId: string;
  consumerKey: string;
  baseUrl: string;
}

export interface SnapTradeUser {
  userId: string;
  userSecret: string;
  createdAt: Date;
}

export interface SnapTradeConnection {
  id: string;
  brokerName: string;
  brokerSlug: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSynced: Date | null;
  accounts: SnapTradeAccount[];
}

export interface SnapTradeAccount {
  id: string;
  name: string;
  number: string;
  type: 'individual' | 'joint' | 'ira' | 'roth_ira' | '401k' | 'other';
  currency: string;
  balance: number;
  holdings: SnapTradePosition[];
}

export interface SnapTradePosition {
  symbol: string;
  description: string;
  units: number;
  price: number;
  marketValue: number;
  currency: string;
  averagePurchasePrice?: number;
  percentOfPortfolio?: number;
}

export interface SnapTradeBrokerage {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  supportsHoldings: boolean;
  supportsOrders: boolean;
}

// API Request/Response types
export interface ConnectBrokerageRequest {
  userId: string;
  userSecret: string;
  brokerageId?: string;
  redirectUri?: string;
}

export interface ConnectBrokerageResponse {
  redirectUrl: string;
  authorizationId: string;
}

export interface SyncHoldingsRequest {
  userId: string;
  userSecret: string;
  accountId?: string; // If not provided, sync all accounts
}

export interface SyncHoldingsResponse {
  holdings: PortfolioHolding[];
  accounts: SnapTradeAccount[];
  lastSynced: Date;
}

// ============================================================================
// CSV Parser Types
// ============================================================================

export type BrokerFormat = 
  | 'fidelity'
  | 'schwab'
  | 'robinhood'
  | 'vanguard'
  | 'td_ameritrade'
  | 'etrade'
  | 'interactive_brokers'
  | 'webull'
  | 'generic';

export interface CSVParseOptions {
  format?: BrokerFormat;
  autoDetect?: boolean;
  includeExtendedData?: boolean;
}

export interface CSVParseResult {
  holdings: PortfolioHolding[];
  detectedFormat: BrokerFormat;
  warnings: string[];
  skippedRows: number;
  totalRows: number;
}

export interface BrokerColumnMapping {
  ticker: string[];
  shares: string[];
  price?: string[];
  value?: string[];
  costBasis?: string[];
}

// ============================================================================
// API Error Types
// ============================================================================

export interface BrokerageError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type BrokerageErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'CONNECTION_EXPIRED'
  | 'BROKER_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'PARSE_ERROR'
  | 'INVALID_FORMAT'
  | 'UNSUPPORTED_BROKER'
  | 'SYNC_FAILED'
  | 'UNKNOWN_ERROR';
