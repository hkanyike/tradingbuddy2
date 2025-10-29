# 🔑 API Keys Setup Guide

## Required API Keys for Full Functionality

### 1. **Market Data APIs** (Choose at least one)

#### **Polygon.io** (Recommended - Best for options)
- **Website**: https://polygon.io/
- **Free Tier**: 5 calls/minute, 1 year historical data
- **Paid Plans**: $99/month for 1000 calls/minute
- **Features**: Real-time quotes, options data, news, historical data
- **Setup**: 
  1. Sign up at polygon.io
  2. Get API key from dashboard
  3. Add to `.env`: `POLYGON_API_KEY=your_key_here`

#### **Alpha Vantage** (Good for beginners)
- **Website**: https://www.alphavantage.co/
- **Free Tier**: 5 calls/minute, 500 calls/day
- **Paid Plans**: $49.99/month for 1200 calls/minute
- **Features**: Stock quotes, technical indicators, news
- **Setup**:
  1. Sign up at alphavantage.co
  2. Get free API key
  3. Add to `.env`: `ALPHA_VANTAGE_API_KEY=your_key_here`

#### **IEX Cloud** (Good balance)
- **Website**: https://iexcloud.io/
- **Free Tier**: 50,000 calls/month
- **Paid Plans**: $9/month for 1M calls/month
- **Features**: Real-time quotes, historical data, news
- **Setup**:
  1. Sign up at iexcloud.io
  2. Get API key from dashboard
  3. Add to `.env`: `IEX_CLOUD_API_KEY=your_key_here`

#### **Financial Modeling Prep** (Cheapest)
- **Website**: https://financialmodelingprep.com/
- **Free Tier**: 250 calls/day
- **Paid Plans**: $14/month for 10,000 calls/day
- **Features**: Stock quotes, financial statements, news
- **Setup**:
  1. Sign up at financialmodelingprep.com
  2. Get API key
  3. Add to `.env`: `FMP_API_KEY=your_key_here`

### 2. **News APIs** (Optional but recommended)

#### **NewsAPI** (Best for general news)
- **Website**: https://newsapi.org/
- **Free Tier**: 1000 requests/day
- **Paid Plans**: $449/month for 1M requests/month
- **Setup**:
  1. Sign up at newsapi.org
  2. Get API key
  3. Add to `.env`: `NEWS_API_KEY=your_key_here`

#### **Benzinga** (Best for financial news)
- **Website**: https://benzinga.com/apis/
- **Free Tier**: 1000 requests/day
- **Paid Plans**: $99/month for 50,000 requests/day
- **Setup**:
  1. Sign up at benzinga.com
  2. Get API key
  3. Add to `.env`: `BENZINGA_API_KEY=your_key_here`

### 3. **AI/ML APIs** (Optional)

#### **OpenAI** (For advanced AI features)
- **Website**: https://openai.com/
- **Pricing**: Pay per use (~$0.002 per 1K tokens)
- **Setup**:
  1. Sign up at openai.com
  2. Get API key
  3. Add to `.env`: `OPENAI_API_KEY=your_key_here`

#### **Hugging Face** (For ML models)
- **Website**: https://huggingface.co/
- **Free Tier**: 1000 requests/month
- **Paid Plans**: $9/month for 10,000 requests/month
- **Setup**:
  1. Sign up at huggingface.co
  2. Get API key
  3. Add to `.env`: `HUGGINGFACE_API_KEY=your_key_here`

### 4. **Trading APIs** (Optional - for live trading)

#### **Alpaca** (Best for paper trading)
- **Website**: https://alpaca.markets/
- **Free Tier**: Paper trading only
- **Paid Plans**: $99/month for live trading
- **Setup**:
  1. Sign up at alpaca.markets
  2. Get API key and secret
  3. Add to `.env`:
     ```
     ALPACA_API_KEY=your_key_here
     ALPACA_API_SECRET=your_secret_here
     ALPACA_BASE_URL=https://paper-api.alpaca.markets
     ```

## 🚀 Quick Setup (Minimum Required)

For basic functionality, you only need **ONE** market data API:

### **Recommended: Alpha Vantage (Free)**
```bash
# 1. Sign up at https://www.alphavantage.co/
# 2. Get your free API key
# 3. Add to your .env file:
ALPHA_VANTAGE_API_KEY=your_free_key_here
```

### **For Production: Polygon.io (Paid)**
```bash
# 1. Sign up at https://polygon.io/
# 2. Get API key from dashboard
# 3. Add to your .env file:
POLYGON_API_KEY=your_polygon_key_here
```

## 📝 Environment Variables Template

Create a `.env` file in your project root:

```env
# Database (Already configured)
DATABASE_URL=your_turso_database_url
TURSO_CONNECTION_URL=your_turso_connection_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# Authentication (Already configured)
NEXTAUTH_URL=https://your-app.onrender.com
NEXTAUTH_SECRET=your_nextauth_secret

# Market Data (Choose at least one)
POLYGON_API_KEY=your_polygon_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
IEX_CLOUD_API_KEY=your_iex_key
FMP_API_KEY=your_fmp_key

# News (Optional)
NEWS_API_KEY=your_news_key
BENZINGA_API_KEY=your_benzinga_key

# AI/ML (Optional)
OPENAI_API_KEY=your_openai_key
HUGGINGFACE_API_KEY=your_huggingface_key

# Trading (Optional)
ALPACA_API_KEY=your_alpaca_key
ALPACA_API_SECRET=your_alpaca_secret
ALPACA_BASE_URL=https://paper-api.alpaca.markets

# MLflow (Optional)
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_EXPERIMENT_NAME=trading-buddy-ml
```

## 🔧 How to Add API Keys

### **For Local Development:**
1. Copy `env.example` to `.env`
2. Add your API keys to `.env`
3. Restart your development server

### **For Production (Render):**
1. Go to your Render dashboard
2. Select your service
3. Go to "Environment" tab
4. Add each API key as a new environment variable
5. Redeploy your service

## 💰 Cost Breakdown

### **Free Tier (Basic Functionality)**
- Alpha Vantage: Free (5 calls/minute)
- NewsAPI: Free (1000 calls/day)
- **Total: $0/month**

### **Production Tier (Recommended)**
- Polygon.io: $99/month
- NewsAPI: $449/month
- **Total: $548/month**

### **Budget Tier (Good for small projects)**
- Financial Modeling Prep: $14/month
- NewsAPI: Free tier
- **Total: $14/month**

## 🎯 What Each API Enables

| API | Real-time Quotes | Historical Data | Options Data | News | Cost |
|-----|------------------|-----------------|--------------|------|------|
| Polygon.io | ✅ | ✅ | ✅ | ✅ | $99/mo |
| Alpha Vantage | ✅ | ✅ | ❌ | ❌ | Free |
| IEX Cloud | ✅ | ✅ | ❌ | ✅ | $9/mo |
| FMP | ✅ | ✅ | ❌ | ❌ | $14/mo |
| NewsAPI | ❌ | ❌ | ❌ | ✅ | Free |
| Benzinga | ❌ | ❌ | ❌ | ✅ | $99/mo |

## 🚀 Next Steps

1. **Choose your market data API** (start with Alpha Vantage free tier)
2. **Add the API key** to your environment variables
3. **Deploy your app** with the new API key
4. **Test the functionality** - you should see real data instead of mock data
5. **Upgrade to paid APIs** as your usage grows

Your Trading Buddy will automatically use the available APIs and fall back to mock data if none are configured!
