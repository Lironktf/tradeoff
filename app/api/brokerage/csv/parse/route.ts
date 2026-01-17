import { NextRequest, NextResponse } from "next/server";
import {
  parseCSV,
  getSupportedFormats,
  getFormatDisplayName,
  validateHoldings,
} from "@/lib/csv-parser";
import type { BrokerFormat } from "@/lib/types/brokerage";

/**
 * GET /api/brokerage/csv/parse
 * 
 * Get list of supported CSV formats/brokers.
 */
export async function GET() {
  const formats = getSupportedFormats();
  
  const supportedFormats = formats.map(format => ({
    id: format,
    name: getFormatDisplayName(format),
  }));

  return NextResponse.json({ 
    formats: supportedFormats,
    autoDetectSupported: true,
  });
}

/**
 * POST /api/brokerage/csv/parse
 * 
 * Parse a CSV file containing portfolio data.
 * 
 * Body:
 * - content: Raw CSV content as string
 * - format?: Broker format (optional, will auto-detect if not provided)
 * - includeExtendedData?: Whether to include price/value data (default: true)
 * 
 * Response:
 * - holdings: Array of portfolio holdings
 * - detectedFormat: The broker format that was detected/used
 * - warnings: Any parsing warnings
 * - stats: Parsing statistics
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    let csvContent: string;
    let format: BrokerFormat | undefined;
    let includeExtendedData = true;

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      
      if (!file) {
        return NextResponse.json(
          { error: "No file provided in form data" },
          { status: 400 }
        );
      }

      csvContent = await file.text();
      format = formData.get("format") as BrokerFormat | undefined;
      includeExtendedData = formData.get("includeExtendedData") !== "false";
    } else {
      // Handle JSON body
      const body = await request.json();
      
      if (!body.content || typeof body.content !== "string") {
        return NextResponse.json(
          { error: "content field is required and must be a string" },
          { status: 400 }
        );
      }

      csvContent = body.content;
      format = body.format;
      includeExtendedData = body.includeExtendedData !== false;
    }

    // Validate content size (limit to 5MB)
    if (csvContent.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "CSV content too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Parse the CSV
    const result = parseCSV(csvContent, {
      format,
      autoDetect: !format,
      includeExtendedData,
    });

    // Validate the parsed holdings
    const validation = validateHoldings(result.holdings);
    if (!validation.valid) {
      result.warnings.push(...validation.issues);
    }

    return NextResponse.json({
      holdings: result.holdings,
      detectedFormat: result.detectedFormat,
      formatName: getFormatDisplayName(result.detectedFormat),
      warnings: result.warnings,
      stats: {
        totalRows: result.totalRows,
        parsedRows: result.holdings.length,
        skippedRows: result.skippedRows,
      },
    });
  } catch (error) {
    console.error("CSV parsing error:", error);
    
    return NextResponse.json(
      { error: "Failed to parse CSV content" },
      { status: 500 }
    );
  }
}
