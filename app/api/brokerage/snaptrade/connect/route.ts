import { NextRequest, NextResponse } from "next/server";
import {
  registerUser,
  getConnectionLink,
  getSupportedBrokerages,
  SnapTradeError,
} from "@/lib/snaptrade";

/**
 * GET /api/brokerage/snaptrade/connect
 * 
 * Get list of supported brokerages
 */
export async function GET() {
  try {
    const brokerages = await getSupportedBrokerages();
    return NextResponse.json({ brokerages });
  } catch (error) {
    console.error("Failed to fetch brokerages:", error);
    
    if (error instanceof SnapTradeError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch supported brokerages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brokerage/snaptrade/connect
 * 
 * Initialize a brokerage connection for a user.
 * 
 * Request body:
 * - userId: External user ID (from your auth system)
 * - userSecret?: Existing SnapTrade user secret (if already registered)
 * - brokerageId?: Specific brokerage to connect (optional)
 * - redirectUri?: Where to redirect after OAuth (optional)
 * 
 * Response:
 * - redirectUrl: URL to redirect user to for OAuth
 * - userId: SnapTrade user ID
 * - userSecret: SnapTrade user secret (store securely!)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userSecret, brokerageId, redirectUri } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Register user with SnapTrade if no secret provided
    let snapTradeUserId = userId;
    let snapTradeUserSecret = userSecret;

    if (!userSecret) {
      const registration = await registerUser(userId);
      snapTradeUserId = registration.userId;
      snapTradeUserSecret = registration.userSecret;
    }

    // Get connection link
    const connection = await getConnectionLink(
      snapTradeUserId,
      snapTradeUserSecret,
      {
        brokerageId,
        redirectUri: redirectUri || `${getBaseUrl(request)}/api/brokerage/snaptrade/callback`,
        connectionType: "read",
      }
    );

    return NextResponse.json({
      redirectUrl: connection.redirectUrl,
      authorizationId: connection.authorizationId,
      userId: snapTradeUserId,
      userSecret: snapTradeUserSecret,
    });
  } catch (error) {
    console.error("Failed to create connection:", error);
    
    if (error instanceof SnapTradeError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to initialize brokerage connection" },
      { status: 500 }
    );
  }
}

/**
 * Get base URL from request for redirect
 */
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
