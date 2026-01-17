/**
 * Enhanced CSV Parser for Brokerage Exports
 * 
 * Supports automatic detection and parsing of portfolio exports from major brokerages:
 * - Fidelity
 * - Charles Schwab
 * - Robinhood
 * - Vanguard
 * - TD Ameritrade
 * - E*Trade
 * - Interactive Brokers
 * - Webull
 * - Generic CSV format
 */

import type {
  PortfolioHolding,
  BrokerFormat,
  CSVParseOptions,
  CSVParseResult,
  BrokerColumnMapping,
} from './types/brokerage';

// ============================================================================
// Broker-Specific Column Mappings
// ============================================================================

const BROKER_MAPPINGS: Record<BrokerFormat, BrokerColumnMapping> = {
  fidelity: {
    ticker: ['symbol', 'ticker'],
    shares: ['quantity', 'shares'],
    price: ['last price', 'current price', 'price'],
    value: ['current value', 'market value', 'value'],
    costBasis: ['cost basis', 'cost basis total', 'total cost'],
  },
  schwab: {
    ticker: ['symbol'],
    shares: ['quantity'],
    price: ['price'],
    value: ['market value'],
    costBasis: ['cost basis'],
  },
  robinhood: {
    ticker: ['symbol', 'instrument'],
    shares: ['quantity', 'shares'],
    price: ['average cost', 'price'],
    value: ['equity', 'market value'],
  },
  vanguard: {
    ticker: ['symbol', 'ticker symbol'],
    shares: ['shares', 'quantity', 'units'],
    price: ['share price', 'price'],
    value: ['total value', 'value'],
    costBasis: ['cost basis', 'total cost basis'],
  },
  td_ameritrade: {
    ticker: ['symbol'],
    shares: ['qty', 'quantity'],
    price: ['mark', 'price'],
    value: ['value'],
    costBasis: ['cost', 'cost basis'],
  },
  etrade: {
    ticker: ['symbol'],
    shares: ['quantity'],
    price: ['price', 'last price'],
    value: ['market value', 'value'],
    costBasis: ['cost basis', 'total cost'],
  },
  interactive_brokers: {
    ticker: ['symbol', 'financial instrument'],
    shares: ['quantity', 'position'],
    price: ['close price', 'price'],
    value: ['market value', 'value'],
    costBasis: ['cost basis', 'avg cost'],
  },
  webull: {
    ticker: ['symbol', 'ticker'],
    shares: ['shares', 'qty'],
    price: ['avg cost', 'price'],
    value: ['market value', 'mkt value'],
  },
  generic: {
    ticker: ['symbol', 'ticker', 'stock', 'name', 'security', 'holding', 'asset', 'code'],
    shares: ['shares', 'quantity', 'qty', 'units', 'amount', 'position', 'holdings', 'count'],
    price: ['price', 'last', 'close', 'current', 'market price', 'share price'],
    value: ['value', 'market value', 'total', 'worth', 'balance'],
    costBasis: ['cost', 'cost basis', 'purchase price', 'avg cost', 'average cost'],
  },
};

// Broker detection patterns (unique identifiers in CSV content)
const BROKER_DETECTION_PATTERNS: Record<BrokerFormat, RegExp[]> = {
  fidelity: [/fidelity/i, /account number.*\d{3}-\d{6}/i],
  schwab: [/schwab/i, /account total/i],
  robinhood: [/robinhood/i],
  vanguard: [/vanguard/i, /vgslx|vtsax|vfiax/i],
  td_ameritrade: [/td ameritrade/i, /tda/i, /ameritrade/i],
  etrade: [/e\*trade/i, /etrade/i],
  interactive_brokers: [/interactive brokers/i, /ibkr/i],
  webull: [/webull/i],
  generic: [], // Fallback, never detected
};

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse CSV content from a brokerage export
 */
export function parseCSV(
  content: string,
  options: CSVParseOptions = {}
): CSVParseResult {
  const { format, autoDetect = true, includeExtendedData = true } = options;
  const warnings: string[] = [];
  let detectedFormat: BrokerFormat = format || 'generic';

  // Clean and prepare content
  const cleanedContent = cleanCSVContent(content);
  const lines = cleanedContent.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) {
    return {
      holdings: [],
      detectedFormat: 'generic',
      warnings: ['Empty or invalid CSV content'],
      skippedRows: 0,
      totalRows: 0,
    };
  }

  // Auto-detect broker format if not specified
  if (autoDetect && !format) {
    detectedFormat = detectBrokerFormat(content);
    if (detectedFormat !== 'generic') {
      // Don't warn for successful auto-detection
    }
  }

  // Parse the CSV
  const { rows, delimiter } = parseCSVRows(lines);
  if (rows.length < 2) {
    return {
      holdings: [],
      detectedFormat,
      warnings: ['CSV must have at least a header row and one data row'],
      skippedRows: 0,
      totalRows: rows.length,
    };
  }

  // Find header row (may not be first row for some brokers)
  const { headerIndex, headers } = findHeaderRow(rows, detectedFormat);
  if (headerIndex === -1) {
    warnings.push('Could not identify header row, using first row');
  }

  // Map columns
  const columnMapping = mapColumns(headers, detectedFormat);
  if (columnMapping.tickerCol === -1) {
    warnings.push('Could not identify ticker/symbol column');
    return {
      holdings: [],
      detectedFormat,
      warnings,
      skippedRows: rows.length - 1,
      totalRows: rows.length,
    };
  }

  if (columnMapping.sharesCol === -1) {
    warnings.push('Could not identify shares/quantity column');
  }

  // Parse data rows
  const holdings: PortfolioHolding[] = [];
  let skippedRows = 0;
  const dataRows = rows.slice(headerIndex + 1);

  for (const row of dataRows) {
    const holding = parseRow(row, columnMapping, includeExtendedData);
    if (holding) {
      // Check for duplicate tickers and merge
      const existingIndex = holdings.findIndex(h => h.ticker === holding.ticker);
      if (existingIndex >= 0) {
        holdings[existingIndex] = mergeHoldings(holdings[existingIndex], holding);
      } else {
        holdings.push(holding);
      }
    } else {
      skippedRows++;
    }
  }

  return {
    holdings,
    detectedFormat,
    warnings,
    skippedRows,
    totalRows: dataRows.length,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Clean CSV content - remove BOM, normalize line endings, etc.
 */
function cleanCSVContent(content: string): string {
  // Remove BOM
  let cleaned = content.replace(/^\uFEFF/, '');
  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return cleaned;
}

/**
 * Detect broker format from CSV content
 */
function detectBrokerFormat(content: string): BrokerFormat {
  const contentLower = content.toLowerCase();
  
  for (const [broker, patterns] of Object.entries(BROKER_DETECTION_PATTERNS)) {
    if (broker === 'generic') continue;
    for (const pattern of patterns) {
      if (pattern.test(contentLower)) {
        return broker as BrokerFormat;
      }
    }
  }
  
  return 'generic';
}

/**
 * Parse CSV rows handling quoted values and delimiters
 */
function parseCSVRows(lines: string[]): { rows: string[][]; delimiter: string } {
  // Detect delimiter
  const firstLine = lines[0];
  let delimiter = ',';
  
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (!firstLine.includes(',') && firstLine.includes(';')) {
    delimiter = ';';
  }

  const rows = lines.map(line => parseCSVLine(line, delimiter));
  return { rows, delimiter };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result.map(cell => cell.replace(/^["']|["']$/g, '').trim());
}

/**
 * Find the header row in the CSV
 */
function findHeaderRow(
  rows: string[][],
  format: BrokerFormat
): { headerIndex: number; headers: string[] } {
  const mapping = BROKER_MAPPINGS[format];
  const tickerKeywords = mapping.ticker;
  const sharesKeywords = mapping.shares;
  
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    const rowLower = row.map(cell => cell.toLowerCase());
    
    const hasTickerColumn = rowLower.some(cell => 
      tickerKeywords.some(keyword => cell.includes(keyword.toLowerCase()))
    );
    const hasSharesColumn = rowLower.some(cell => 
      sharesKeywords.some(keyword => cell.includes(keyword.toLowerCase()))
    );
    
    if (hasTickerColumn || hasSharesColumn) {
      return { headerIndex: i, headers: row };
    }
  }
  
  // Default to first row
  return { headerIndex: 0, headers: rows[0] || [] };
}

interface ColumnIndexes {
  tickerCol: number;
  sharesCol: number;
  priceCol: number;
  valueCol: number;
  costBasisCol: number;
}

/**
 * Map column names to indices
 */
function mapColumns(headers: string[], format: BrokerFormat): ColumnIndexes {
  const mapping = BROKER_MAPPINGS[format];
  const headersLower = headers.map(h => h.toLowerCase());
  
  const findColumn = (keywords: string[] | undefined): number => {
    if (!keywords) return -1;
    for (let i = 0; i < headersLower.length; i++) {
      for (const keyword of keywords) {
        if (headersLower[i].includes(keyword.toLowerCase())) {
          return i;
        }
      }
    }
    return -1;
  };
  
  return {
    tickerCol: findColumn(mapping.ticker),
    sharesCol: findColumn(mapping.shares),
    priceCol: findColumn(mapping.price),
    valueCol: findColumn(mapping.value),
    costBasisCol: findColumn(mapping.costBasis),
  };
}

/**
 * Parse a single data row into a PortfolioHolding
 */
function parseRow(
  row: string[],
  columns: ColumnIndexes,
  includeExtended: boolean
): PortfolioHolding | null {
  const { tickerCol, sharesCol, priceCol, valueCol, costBasisCol } = columns;
  
  // Get ticker
  const rawTicker = row[tickerCol] || '';
  const ticker = cleanTicker(rawTicker);
  if (!ticker) return null;
  
  // Get shares
  let shares = 0;
  if (sharesCol >= 0 && row[sharesCol]) {
    shares = parseNumber(row[sharesCol]);
  }
  
  // If no shares column, try to infer from value and price
  if (shares <= 0 && valueCol >= 0 && priceCol >= 0) {
    const value = parseNumber(row[valueCol] || '');
    const price = parseNumber(row[priceCol] || '');
    if (value > 0 && price > 0) {
      shares = value / price;
    }
  }
  
  // Skip if we couldn't determine shares
  if (shares <= 0) return null;
  
  const holding: PortfolioHolding = {
    ticker,
    shares: Math.round(shares * 10000) / 10000, // Round to 4 decimal places
  };
  
  // Add extended data if requested
  if (includeExtended) {
    if (priceCol >= 0 && row[priceCol]) {
      const price = parseNumber(row[priceCol]);
      if (price > 0) {
        holding.averagePrice = price;
      }
    }
    
    if (valueCol >= 0 && row[valueCol]) {
      const value = parseNumber(row[valueCol]);
      if (value > 0) {
        holding.currentValue = value;
      }
    }
    
    if (costBasisCol >= 0 && row[costBasisCol]) {
      const costBasis = parseNumber(row[costBasisCol]);
      if (costBasis > 0) {
        holding.costBasis = costBasis;
      }
    }
  }
  
  return holding;
}

/**
 * Clean and validate a ticker symbol
 */
function cleanTicker(raw: string): string | null {
  // Remove common prefixes/suffixes
  let cleaned = raw
    .toUpperCase()
    .replace(/^\*/, '') // Leading asterisk (pending transactions)
    .replace(/\s+/g, '') // Whitespace
    .replace(/[^\w.]/g, ''); // Non-alphanumeric except dots
  
  // Handle special cases
  if (cleaned.includes('CASH') || cleaned.includes('MONEY MARKET')) {
    return null; // Skip cash positions
  }
  if (cleaned.includes('PENDING')) {
    return null; // Skip pending
  }
  
  // Remove trailing class indicators (e.g., "GOOGL.A" -> "GOOGL")
  cleaned = cleaned.replace(/\.[A-Z]$/, '');
  
  // Validate: should be 1-5 characters
  if (cleaned.length < 1 || cleaned.length > 5) {
    return null;
  }
  
  // Should contain at least one letter
  if (!/[A-Z]/.test(cleaned)) {
    return null;
  }
  
  return cleaned;
}

/**
 * Parse a number from various formats
 */
function parseNumber(value: string): number {
  // Remove currency symbols, commas, parentheses (negative)
  let cleaned = value
    .replace(/[$€£¥]/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .trim();
  
  // Handle negative in parentheses: (123.45) -> -123.45
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }
  
  // Handle percentages
  if (cleaned.endsWith('%')) {
    cleaned = cleaned.slice(0, -1);
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num / 100;
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Merge two holdings of the same ticker
 */
function mergeHoldings(existing: PortfolioHolding, newHolding: PortfolioHolding): PortfolioHolding {
  const totalShares = existing.shares + newHolding.shares;
  
  // Calculate weighted average price if both have prices
  let averagePrice: number | undefined;
  if (existing.averagePrice && newHolding.averagePrice) {
    averagePrice = 
      (existing.shares * existing.averagePrice + newHolding.shares * newHolding.averagePrice) / 
      totalShares;
  } else {
    averagePrice = existing.averagePrice || newHolding.averagePrice;
  }
  
  return {
    ticker: existing.ticker,
    shares: totalShares,
    averagePrice,
    currentValue: (existing.currentValue || 0) + (newHolding.currentValue || 0) || undefined,
    costBasis: (existing.costBasis || 0) + (newHolding.costBasis || 0) || undefined,
    currency: existing.currency || newHolding.currency,
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Get list of supported broker formats
 */
export function getSupportedFormats(): BrokerFormat[] {
  return Object.keys(BROKER_MAPPINGS) as BrokerFormat[];
}

/**
 * Get display name for a broker format
 */
export function getFormatDisplayName(format: BrokerFormat): string {
  const names: Record<BrokerFormat, string> = {
    fidelity: 'Fidelity',
    schwab: 'Charles Schwab',
    robinhood: 'Robinhood',
    vanguard: 'Vanguard',
    td_ameritrade: 'TD Ameritrade',
    etrade: 'E*Trade',
    interactive_brokers: 'Interactive Brokers',
    webull: 'Webull',
    generic: 'Generic CSV',
  };
  return names[format];
}

/**
 * Validate that parsed holdings look reasonable
 */
export function validateHoldings(holdings: PortfolioHolding[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (holdings.length === 0) {
    issues.push('No holdings found');
    return { valid: false, issues };
  }
  
  // Check for unusually large positions
  for (const holding of holdings) {
    if (holding.shares > 10000000) {
      issues.push(`Unusually large position in ${holding.ticker}: ${holding.shares} shares`);
    }
  }
  
  // Check for duplicate tickers (shouldn't happen after merging)
  const tickers = holdings.map(h => h.ticker);
  const uniqueTickers = new Set(tickers);
  if (tickers.length !== uniqueTickers.size) {
    issues.push('Duplicate tickers found');
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}
