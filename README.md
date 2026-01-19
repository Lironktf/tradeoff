# TradeOff

My own personal fork, find the worked in repo at https://github.com/pauligwe/tradeoff

> **Built for NexHacks 2026**

https://github.com/user-attachments/assets/416009f3-9cdd-49d1-841f-b715a6f0a7ef

A portfolio hedging platform that connects your stock investments with Polymarket prediction markets. TradeOff analyzes your portfolio risks and recommends actionable hedges using real prediction market data.

## What It Does

TradeOff helps investors protect their portfolios by:

1. **Importing your portfolio** via brokerage connection (SnapTrade), CSV upload, or manual entry
2. **Analyzing risk exposures** including sector concentration, position sizing, and diversification
3. **Recommending hedges** from active Polymarket prediction markets that offset your specific risks
4. **Tracking relevant news** that could impact your hedges
5. **Visualizing payoff scenarios** with Greeks analysis and P&L projections

## Features

### Portfolio Management
- **Brokerage Integration**: Connect Wealthsimple, Questrade, or other brokerages via SnapTrade
- **CSV Import**: Upload portfolio exports from any platform
- **Manual Entry**: Add individual positions with ticker and share count
- **Real-time Pricing**: Live stock prices and sector classification from Yahoo Finance

### Risk Analysis
- Sector concentration breakdown with pie chart visualization
- Top holdings by portfolio weight
- Position sizing alerts for overweight stocks
- Diversification scoring compared to typical portfolios
- Unknown sector filtering to avoid false risk signals

### Hedge Recommendations
- AI-powered matching of portfolio risks to Polymarket events
- Confidence scoring (high/medium) for each recommendation
- Direct links to place hedges on Polymarket
- Affected stocks highlighted for each hedge
- Only shows unresolved, active prediction markets

### Wood Wide AI Integration
- Historical correlation analysis between market events and stock performance
- Semantic matching to find similar past scenarios
- Confidence boosts based on historical accuracy
- Pattern recognition across market conditions

### News Feed
- Relevant news articles for your portfolio and hedges
- Filter by individual stock tickers
- Only shows filters for stocks with available articles

### Greeks Analysis
- Payoff curves for selected hedges
- P&L scenario analysis at different probability levels
- Recommended position sizing based on portfolio exposure

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: TailwindCSS 4
- **Charts**: Recharts
- **Brokerage**: SnapTrade SDK
- **Stock Data**: Yahoo Finance
- **AI**: Groq (Grok-2 for analysis)
- **Prediction Markets**: Polymarket Gamma API
- **Historical Analysis**: Wood Wide AI

## Setup

1. **Clone the repository**:
```bash
git clone https://github.com/pauligwe/TradeOff
cd nexhacks
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:

Create a `.env.local` file:

```bash
# Required
GROQ_API_KEY=your_groq_api_key

# Brokerage Integration (SnapTrade)
SNAPTRADE_CLIENT_ID=your_snaptrade_client_id
SNAPTRADE_CONSUMER_KEY=your_snaptrade_consumer_key

# Optional
NEWS_API_KEY=your_news_api_key
WOOD_WIDE_API_KEY=your_wood_wide_api_key
```

4. **Run the development server**:
```bash
npm run dev
```

5. **Open the app**: [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/app
  /api
    /analyze          - Hedge recommendation engine
    /brokerage        - SnapTrade integration endpoints
    /correlation      - Wood Wide AI historical analysis
    /markets          - Polymarket data fetching
    /news             - News article aggregation
    /risk-analysis    - Portfolio risk assessment
    /stocks           - Stock data from Yahoo Finance
  page.tsx            - Main app with tab navigation

/components
  /portfolio          - Portfolio view and charts
  /hedge              - Hedge recommendations display
  /risk               - Risk analysis cards
  /greeks             - Payoff curves and scenarios
  /news               - News feed with filters
  Sidebar.tsx         - Navigation sidebar
  PortfolioInput.tsx  - Stock entry and import

/lib
  polymarket.ts       - Polymarket API client
  grok.ts             - Groq LLM integration
  stocks.ts           - Yahoo Finance wrapper
```

## Usage

1. **Get Started**: Click "Get Started" on the intro screen
2. **Add Portfolio**: Connect your brokerage, upload CSV, or manually add stocks
3. **Analyze**: Click "Analyze Portfolio" to generate hedge recommendations
4. **Review Hedges**: Browse recommended Polymarket positions sorted by relevance
5. **Check Risks**: View sector breakdown and risk alerts
6. **Read News**: Stay informed about events affecting your hedges
7. **Explore Greeks**: Analyze payoff scenarios for selected hedges

## License

MIT

## Acknowledgments

- **Polymarket** for prediction market data and infrastructure
- **Wood Wide AI** for historical correlation analysis
- **Groq** for fast LLM inference
- **SnapTrade** for brokerage connectivity
