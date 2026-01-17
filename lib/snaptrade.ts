/**
 * SnapTrade Integration Library
 * 
 * Provides seamless brokerage connection and portfolio syncing via SnapTrade API.
 * Documentation: https://docs.snaptrade.com/
 */

import crypto from 'crypto';
import type {
  SnapTradeConfig,
  SnapTradeUser,
  SnapTradeConnection,
  SnapTradeAccount,
  SnapTradePosition,
  SnapTradeBrokerage,
  ConnectBrokerageResponse,
  PortfolioHolding,
  BrokerageError,
  BrokerageErrorCode,
} from './types/brokerage';

// ============================================================================
// Configuration
// ============================================================================

const SNAPTRADE_BASE_URL = 'https://api.snaptrade.com/api/v1';

function getConfig(): SnapTradeConfig {
  const clientId = process.env.SNAPTRADE_CLIENT_ID;
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY;

  if (!clientId || !consumerKey) {
    throw new SnapTradeError(
      'INVALID_CREDENTIALS',
      'SnapTrade credentials not configured. Set SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY environment variables.'
    );
  }

  return {
    clientId,
    consumerKey,
    baseUrl: SNAPTRADE_BASE_URL,
  };
}

// ============================================================================
// Error Handling
// ============================================================================

export class SnapTradeError extends Error implements BrokerageError {
  code: BrokerageErrorCode;
  details?: Record<string, unknown>;

  constructor(code: BrokerageErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'SnapTradeError';
    this.code = code;
    this.details = details;
  }
}

// ============================================================================
// Authentication Helpers
// ============================================================================

/**
 * Generate HMAC signature for SnapTrade API requests
 */
function generateSignature(
  consumerKey: string,
  requestPath: string,
  timestamp: string,
  content?: string
): string {
  const signatureContent = `${requestPath}${timestamp}${content || ''}`;
  return crypto
    .createHmac('sha256', consumerKey)
    .update(signatureContent)
    .digest('base64');
}

/**
 * Make authenticated request to SnapTrade API
 */
async function snapTradeRequest<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: Record<string, unknown>,
  userCredentials?: { userId: string; userSecret: string }
): Promise<T> {
  const config = getConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const url = `${config.baseUrl}${path}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Timestamp': timestamp,
    'clientId': config.clientId,
  };

  // Add user credentials if provided
  if (userCredentials) {
    headers['userId'] = userCredentials.userId;
    headers['userSecret'] = userCredentials.userSecret;
  }

  // Generate signature
  const bodyStr = body ? JSON.stringify(body) : '';
  headers['Signature'] = generateSignature(config.consumerKey, path, timestamp, bodyStr);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? bodyStr : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new SnapTradeError(
        mapHttpStatusToErrorCode(response.status),
        errorData.message || `SnapTrade API error: ${response.status}`,
        errorData
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof SnapTradeError) throw error;
    throw new SnapTradeError(
      'UNKNOWN_ERROR',
      `Failed to communicate with SnapTrade: ${(error as Error).message}`
    );
  }
}

function mapHttpStatusToErrorCode(status: number): BrokerageErrorCode {
  switch (status) {
    case 401:
    case 403:
      return 'INVALID_CREDENTIALS';
    case 429:
      return 'RATE_LIMITED';
    case 503:
      return 'BROKER_UNAVAILABLE';
    default:
      return 'UNKNOWN_ERROR';
  }
}

// ============================================================================
// User Management
// ============================================================================

/**
 * Register a new user with SnapTrade
 * This creates a user ID and secret that will be used for all subsequent requests
 */
export async function registerUser(externalUserId: string): Promise<SnapTradeUser> {
  const response = await snapTradeRequest<{
    userId: string;
    userSecret: string;
  }>('POST', '/snapTrade/registerUser', {
    userId: externalUserId,
  });

  return {
    userId: response.userId,
    userSecret: response.userSecret,
    createdAt: new Date(),
  };
}

/**
 * Delete a user and all their connections from SnapTrade
 */
export async function deleteUser(userId: string, userSecret: string): Promise<void> {
  await snapTradeRequest('DELETE', `/snapTrade/deleteUser`, undefined, {
    userId,
    userSecret,
  });
}

// ============================================================================
// Brokerage Connection
// ============================================================================

/**
 * Get list of supported brokerages
 */
export async function getSupportedBrokerages(): Promise<SnapTradeBrokerage[]> {
  const response = await snapTradeRequest<Array<{
    id: string;
    name: string;
    slug: string;
    url?: string;
    logo?: string;
    features?: string[];
  }>>('GET', '/brokerages');

  return response.map(b => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logoUrl: b.logo,
    supportsHoldings: b.features?.includes('holdings') ?? true,
    supportsOrders: b.features?.includes('orders') ?? false,
  }));
}

/**
 * Generate connection link for user to connect their brokerage
 * Returns a URL that the user should be redirected to
 */
export async function getConnectionLink(
  userId: string,
  userSecret: string,
  options?: {
    brokerageId?: string;
    redirectUri?: string;
    connectionType?: 'read' | 'trade';
  }
): Promise<ConnectBrokerageResponse> {
  const response = await snapTradeRequest<{
    redirectURI: string;
    sessionId: string;
  }>(
    'POST',
    '/snapTrade/login',
    {
      broker: options?.brokerageId,
      immediateRedirect: true,
      customRedirect: options?.redirectUri,
      connectionType: options?.connectionType || 'read',
    },
    { userId, userSecret }
  );

  return {
    redirectUrl: response.redirectURI,
    authorizationId: response.sessionId,
  };
}

/**
 * Get all connections for a user
 */
export async function getUserConnections(
  userId: string,
  userSecret: string
): Promise<SnapTradeConnection[]> {
  const response = await snapTradeRequest<Array<{
    id: string;
    brokerage: {
      name: string;
      slug: string;
    };
    name: string;
    disabled: boolean;
    disabled_date?: string;
    meta?: {
      last_synced?: string;
    };
  }>>('GET', '/authorizations', undefined, { userId, userSecret });

  return response.map(conn => ({
    id: conn.id,
    brokerName: conn.brokerage.name,
    brokerSlug: conn.brokerage.slug,
    status: conn.disabled ? 'disconnected' : 'connected',
    lastSynced: conn.meta?.last_synced ? new Date(conn.meta.last_synced) : null,
    accounts: [], // Will be populated separately
  }));
}

/**
 * Disconnect a brokerage connection
 */
export async function disconnectBrokerage(
  userId: string,
  userSecret: string,
  authorizationId: string
): Promise<void> {
  await snapTradeRequest(
    'DELETE',
    `/authorizations/${authorizationId}`,
    undefined,
    { userId, userSecret }
  );
}

// ============================================================================
// Account & Holdings
// ============================================================================

/**
 * Get all accounts for a user across all connected brokerages
 */
export async function getAccounts(
  userId: string,
  userSecret: string
): Promise<SnapTradeAccount[]> {
  const response = await snapTradeRequest<Array<{
    id: string;
    name: string;
    number: string;
    sync_status: {
      holdings: { last_synced: string };
    };
    meta: {
      type?: string;
    };
    cash?: number;
    currency?: { code: string };
  }>>('GET', '/accounts', undefined, { userId, userSecret });

  return response.map(acc => ({
    id: acc.id,
    name: acc.name,
    number: acc.number,
    type: mapAccountType(acc.meta?.type),
    currency: acc.currency?.code || 'USD',
    balance: acc.cash || 0,
    holdings: [], // Will be populated separately
  }));
}

function mapAccountType(type?: string): SnapTradeAccount['type'] {
  const typeMap: Record<string, SnapTradeAccount['type']> = {
    'individual': 'individual',
    'joint': 'joint',
    'ira': 'ira',
    'roth_ira': 'roth_ira',
    'roth ira': 'roth_ira',
    '401k': '401k',
    '401(k)': '401k',
  };
  return typeMap[type?.toLowerCase() || ''] || 'other';
}

/**
 * Get holdings for a specific account
 */
export async function getAccountHoldings(
  userId: string,
  userSecret: string,
  accountId: string
): Promise<SnapTradePosition[]> {
  const response = await snapTradeRequest<{
    account: { id: string };
    positions: Array<{
      symbol: {
        symbol: string;
        description?: string;
        currency?: { code: string };
      };
      units: number;
      price: number;
      open_pnl?: number;
      fractional_units?: number;
      average_purchase_price?: number;
    }>;
    total_value: number;
  }>('GET', `/accounts/${accountId}/holdings`, undefined, { userId, userSecret });

  const totalValue = response.total_value || 1;

  return response.positions.map(pos => ({
    symbol: pos.symbol.symbol,
    description: pos.symbol.description || pos.symbol.symbol,
    units: pos.units + (pos.fractional_units || 0),
    price: pos.price,
    marketValue: (pos.units + (pos.fractional_units || 0)) * pos.price,
    currency: pos.symbol.currency?.code || 'USD',
    averagePurchasePrice: pos.average_purchase_price,
    percentOfPortfolio: ((pos.units * pos.price) / totalValue) * 100,
  }));
}

/**
 * Get all holdings across all accounts for a user
 * This is the main method to use for syncing portfolio
 */
export async function getAllHoldings(
  userId: string,
  userSecret: string
): Promise<{
  holdings: PortfolioHolding[];
  accounts: SnapTradeAccount[];
}> {
  // Get all accounts
  const accounts = await getAccounts(userId, userSecret);
  
  // Get holdings for each account in parallel
  const holdingsPromises = accounts.map(async (account) => {
    try {
      const positions = await getAccountHoldings(userId, userSecret, account.id);
      account.holdings = positions;
      return positions;
    } catch (error) {
      console.error(`Failed to fetch holdings for account ${account.id}:`, error);
      return [];
    }
  });

  const allPositions = await Promise.all(holdingsPromises);
  const flatPositions = allPositions.flat();

  // Aggregate positions by symbol (combine holdings across accounts)
  const aggregatedHoldings = aggregateHoldings(flatPositions);

  return {
    holdings: aggregatedHoldings,
    accounts,
  };
}

/**
 * Aggregate holdings by symbol, combining positions from multiple accounts
 */
function aggregateHoldings(positions: SnapTradePosition[]): PortfolioHolding[] {
  const holdingsMap = new Map<string, PortfolioHolding>();

  for (const pos of positions) {
    // Skip non-equity positions (options, bonds, etc.)
    if (!isEquitySymbol(pos.symbol)) continue;

    const existing = holdingsMap.get(pos.symbol);
    if (existing) {
      // Combine holdings
      const totalUnits = existing.shares + pos.units;
      const totalValue = (existing.currentValue || 0) + pos.marketValue;
      const weightedAvgPrice = existing.averagePrice && pos.averagePurchasePrice
        ? ((existing.shares * existing.averagePrice) + (pos.units * pos.averagePurchasePrice)) / totalUnits
        : existing.averagePrice || pos.averagePurchasePrice;

      existing.shares = totalUnits;
      existing.currentValue = totalValue;
      existing.averagePrice = weightedAvgPrice;
    } else {
      holdingsMap.set(pos.symbol, {
        ticker: pos.symbol,
        shares: pos.units,
        currentValue: pos.marketValue,
        averagePrice: pos.averagePurchasePrice,
        currency: pos.currency,
      });
    }
  }

  return Array.from(holdingsMap.values());
}

/**
 * Check if a symbol is a standard equity (stock/ETF)
 * Filters out options, futures, bonds, etc.
 */
function isEquitySymbol(symbol: string): boolean {
  // Skip if symbol contains option indicators
  if (/\d{6}[CP]\d+/.test(symbol)) return false; // Option format
  if (symbol.includes(' ')) return false; // Complex instruments
  if (symbol.length > 5 && !symbol.includes('.')) return false; // Likely not a standard ticker
  
  return true;
}

// ============================================================================
// Sync Helpers
// ============================================================================

/**
 * Force a refresh of holdings data from the brokerage
 */
export async function refreshHoldings(
  userId: string,
  userSecret: string,
  accountId?: string
): Promise<void> {
  const path = accountId 
    ? `/accounts/${accountId}/holdings/refresh`
    : '/holdings/refresh';
  
  await snapTradeRequest('POST', path, undefined, { userId, userSecret });
}

/**
 * Check if credentials are valid and connection is active
 */
export async function validateConnection(
  userId: string,
  userSecret: string
): Promise<boolean> {
  try {
    await getAccounts(userId, userSecret);
    return true;
  } catch {
    return false;
  }
}
