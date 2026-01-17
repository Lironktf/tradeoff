import { NextRequest, NextResponse } from "next/server";
import { getStockData } from "@/lib/stocks";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tickersParam = searchParams.get("tickers");

    if (!tickersParam) {
      return NextResponse.json(
        { error: "Tickers parameter is required" },
        { status: 400 }
      );
    }

    const tickers = tickersParam.split(",").map((t) => t.trim().toUpperCase());
    const stockData = await getStockData(tickers);

    return NextResponse.json({ stocks: stockData });
  } catch (error) {
    console.error("Stock data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
