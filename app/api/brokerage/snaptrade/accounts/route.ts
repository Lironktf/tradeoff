import { NextRequest, NextResponse } from "next/server";
import {
  getAccounts,
  getUserConnections,
  disconnectBrokerage,
  validateConnection,
  SnapTradeError,
} from "@/lib/snaptrade";

/**
 * GET /api/brokerage/snaptrade/accounts
 * 
 * Get all connected accounts for a user.
 * 
 * Headers required:
 * - x-snaptrade-user-id: SnapTrade user ID
 * - x-snaptrade-user-secret: SnapTrade user secret
 * 
 * Response:
 * - accounts: Array of connected brokerage accounts
 * - connections: Array of brokerage connections
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-snaptrade-user-id");
    const userSecret = request.headers.get("x-snaptrade-user-secret");

    if (!userId || !userSecret) {
      return NextResponse.json(
        { error: "Missing SnapTrade credentials in headers" },
        { status: 401 }
      );
    }

    // Validate connection first
    const isValid = await validateConnection(userId, userSecret);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired SnapTrade credentials", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    // Fetch accounts and connections in parallel
    const [accounts, connections] = await Promise.all([
      getAccounts(userId, userSecret),
      getUserConnections(userId, userSecret),
    ]);

    return NextResponse.json({
      accounts,
      connections,
    });
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    
    if (error instanceof SnapTradeError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brokerage/snaptrade/accounts
 * 
 * Disconnect a brokerage connection.
 * 
 * Headers required:
 * - x-snaptrade-user-id: SnapTrade user ID
 * - x-snaptrade-user-secret: SnapTrade user secret
 * 
 * Query params:
 * - authorizationId: The authorization ID to disconnect
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-snaptrade-user-id");
    const userSecret = request.headers.get("x-snaptrade-user-secret");

    if (!userId || !userSecret) {
      return NextResponse.json(
        { error: "Missing SnapTrade credentials in headers" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const authorizationId = searchParams.get("authorizationId");

    if (!authorizationId) {
      return NextResponse.json(
        { error: "authorizationId query parameter is required" },
        { status: 400 }
      );
    }

    await disconnectBrokerage(userId, userSecret, authorizationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to disconnect brokerage:", error);
    
    if (error instanceof SnapTradeError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to disconnect brokerage" },
      { status: 500 }
    );
  }
}
