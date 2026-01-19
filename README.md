# TradeOff
> **Built for NexHacks 2026** | Powered by Polymarket, Groq & Wood Wide AI

https://github.com/user-attachments/assets/416009f3-9cdd-49d1-841f-b715a6f0a7ef

An advanced prediction market analytics platform that helps investors hedge their stock portfolios using Polymarket prediction markets. The system uses **Wood Wide AI** for numeric reasoning and risk analysis to identify portfolio vulnerabilities and recommend actionable hedges.

## Overview

Polymarket Terminal demonstrates a complete **numeric decision workflow** using Wood Wide AI:

1. **What happened?** → Portfolio risk analysis identifies concentration risks, sector exposures, and anomalies
2. **Why does it matter?** → Wood Wide AI classifies portfolio profiles and calculates numeric risk scores
3. **What should happen next?** → Actionable hedge recommendations via Polymarket prediction markets

## Hackathon Tracks

### Primary: Polymarket
- Fetches real-time prediction market data from Polymarket's Gamma API
- Matches portfolio risks to relevant prediction markets
- Provides direct links to hedge positions on Polymarket

### Secondary: Wood Wide AI
- **Portfolio Classification**: Uses Wood Wide's numeric reasoning to classify portfolios (conservative, moderate, aggressive, speculative)
- **Anomaly Detection**: Identifies unusual positions that deviate from typical investor patterns
- **Risk Scoring**: Calculates interpretable risk scores (1-100) based on concentration, sector exposure, and position sizing
- **Pattern Analysis**: Detects risky portfolio patterns using structured data analysis

## 🧠 Wood Wide AI Integration

### Numeric Decision Workflow

The app implements Wood Wide's core principles:

**Structured Data Input**:
- Portfolio holdings (ticker, shares, value, weight)
- Sector concentrations
- Position sizes
- Historical patterns from reference portfolios

**Numeric Reasoning**:
- Classification model trained on reference portfolio data
- Anomaly detection comparing user portfolios to typical patterns
- Risk score calculation using multiple numeric factors

**Actionable Outputs**:
- Portfolio profile classification with confidence scores
- Specific anomaly alerts for unusual positions
- Numeric risk scores with clear thresholds
- Hedge recommendations tied to specific risks

### Wood Wide API Workflow

```typescript
// 1. Upload portfolio data as structured CSV
const dataset = await woodWideClient.uploadDatasetCSV(portfolioData);

// 2. Train/use anomaly detection model
const model = await woodWideClient.trainAnomalyModel(dataset.id);

// 3. Run inference to detect anomalies
const anomalies = await woodWideClient.detectAnomalies(model.id, dataset.id);

// 4. Generate interpretable insights
const insights = generateInsights(anomalies, classification);
```

## Features

- **Portfolio Management**: Add stocks, view real-time prices, track positions
- **Risk Analysis**: Comprehensive risk assessment powered by Wood Wide AI
  - Concentration risk detection
  - Sector exposure analysis
  - Anomaly detection for unusual positions
  - Benchmark comparisons to typical portfolios
- **Hedge Recommendations**: AI-powered suggestions for Polymarket bets that hedge portfolio risks
- **News Integration**: Relevant news articles for selected prediction markets
- **Greeks Analysis**: Portfolio sensitivity metrics and hedge effectiveness

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **AI/ML**: 
  - Wood Wide AI (numeric reasoning, anomaly detection, classification)
  - Groq (LLM analysis via Grok-2)
- **Data Sources**:
  - Polymarket Gamma API (prediction markets)
  - Yahoo Finance (stock data)
  - News API (market news)
- **Compression**: Token.company Bear1 (context compression)

## 📦 Setup

1. **Clone the repository**:
```bash
git clone (https://github.com/pauligwe/TradeOff)
cd nexhacks
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:

Create a `.env.local` file with:

```bash
# Required
GROQ_API_KEY=your_groq_api_key_here

# Optional (for enhanced features)
WOOD_WIDE_API_KEY=your_wood_wide_api_key_here
TOKEN_COMPANY_API_KEY=your_token_company_api_key_here
NEWS_API_KEY=your_news_api_key_here
```

4. **Run the development server**:
```bash
npm run dev
```

5. **Open the app**:
Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Build Your Portfolio**: Sign into you're brokerage account or upload csv file
2. **Analyze Risks**: View Wood Wide AI's risk analysis and portfolio classification
3. **Find Hedges**: Get AI-recommended Polymarket bets that hedge your specific risks
4. **Track News**: Stay informed about events affecting your hedges
5. **Monitor Greeks**: Understand your portfolio's sensitivity to market changes

## Wood Wide AI Examples

### Portfolio Classification
```
Input: Portfolio with 80% tech stocks, 3 holdings
Output: "Speculative" profile (92% confidence)
Insight: "High concentration risk - similar to portfolios that saw 50%+ drawdowns"
```

### Anomaly Detection
```
Input: Portfolio with one 45% position
Output: Anomaly detected on NVDA (score: 0.87)
Insight: "Position size exceeds typical institutional limits of 10-15%"
```

### Risk Scoring
```
Input: Diversified 20-stock portfolio
Output: Risk Score: 42/100
Insight: "Moderate risk - tech exposure and concentration within normal ranges"
```

## 📊 Data Flow

```
User Portfolio → Wood Wide AI Analysis → Risk Identification → Polymarket Matching → Hedge Recommendations
     ↓                    ↓                      ↓                     ↓                    ↓
  [Stocks]        [Classification]         [Anomalies]          [Events]            [Actionable Bets]
                  [Risk Scores]            [Patterns]           [Probabilities]
```

## Architecture

- `/app` - Next.js app router pages and API routes
- `/components` - React components for UI
- `/lib` - Core business logic
  - `woodwide.ts` - Wood Wide AI client and analysis
  - `polymarket.ts` - Polymarket API integration
  - `risk-factors.ts` - Risk detection rules
  - `grok.ts` - LLM analysis
- `/app/api` - Backend API endpoints
  - `/analyze` - Hedge recommendation engine
  - `/risk-analysis` - Portfolio risk assessment
  - `/stocks` - Stock data fetching

## License

MIT

## Acknowledgments

- **Polymarket** for prediction market data and infrastructure
- **Wood Wide AI** for numeric reasoning and anomaly detection capabilities
- **Groq** for fast LLM inference
- **NexHacks 2026** for the hackathon opportunity
