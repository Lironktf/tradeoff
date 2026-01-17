import { NextRequest, NextResponse } from "next/server";
import { fetchActiveMarkets } from "@/lib/polymarket";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    const markets = await fetchActiveMarkets(limit);

    return NextResponse.json({ markets });
  } catch (error) {
    console.error("Markets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}
