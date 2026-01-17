import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/brokerage/snaptrade/callback
 * 
 * OAuth callback handler for SnapTrade.
 * After user completes brokerage OAuth, SnapTrade redirects here.
 * 
 * Query params (from SnapTrade):
 * - status: 'success' | 'error'
 * - authorizationId: The authorization ID from the connect request
 * - broker: The brokerage slug that was connected
 * 
 * This endpoint should redirect to your frontend with the connection status.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get("status") || "error";
  const authorizationId = searchParams.get("authorizationId") || "";
  const broker = searchParams.get("broker") || "";
  const errorMessage = searchParams.get("error_message") || "";

  // Build redirect URL to frontend
  // The frontend should handle displaying success/error to user
  const baseUrl = getBaseUrl(request);
  const redirectParams = new URLSearchParams({
    status,
    authorizationId,
    broker,
    ...(errorMessage && { error: errorMessage }),
  });

  // Redirect to frontend brokerage connection page
  // Adjust this path based on your frontend routing
  const redirectUrl = `${baseUrl}/?brokerage_callback=true&${redirectParams.toString()}`;

  return NextResponse.redirect(redirectUrl);
}

/**
 * POST /api/brokerage/snaptrade/callback
 * 
 * Alternative webhook handler if using SnapTrade webhooks.
 * Receives notifications about connection status changes.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log webhook for debugging (in production, process and store appropriately)
    console.log("SnapTrade webhook received:", body);
    
    const { event, userId, authorizationId, data } = body;
    
    // Handle different webhook events
    switch (event) {
      case "CONNECTION_CREATED":
        console.log(`User ${userId} connected brokerage: ${data?.broker}`);
        // In a real app: Update user's connection status in database
        break;
        
      case "CONNECTION_DELETED":
        console.log(`User ${userId} disconnected brokerage`);
        // In a real app: Remove connection from database
        break;
        
      case "HOLDINGS_UPDATED":
        console.log(`Holdings updated for authorization ${authorizationId}`);
        // In a real app: Trigger portfolio refresh
        break;
        
      case "CONNECTION_ERROR":
        console.error(`Connection error for user ${userId}:`, data?.error);
        // In a real app: Notify user, log error
        break;
        
      default:
        console.log(`Unknown webhook event: ${event}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

/**
 * Get base URL from request
 */
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
