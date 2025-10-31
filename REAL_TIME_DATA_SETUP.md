# Real-Time Data Setup Guide

## Current Status

🔴 **DEFAULT MODE: Estimated Data**
- Stock prices: Hardcoded estimates
- Contract prices: Black-Scholes calculations
- Greeks: Simplified formulas
- IV: Simulated volatility
- ML Predictions: Simulated (not trained models)

🟢 **PRODUCTION MODE: Live Alpaca Data** (When configured)
- Stock prices: Real-time from Alpaca
- Contract prices: Live options chain data
- Greeks: Real Greeks from Alpaca
- IV: Live implied volatility
- ML Predictions: Still simulated (train models separately)

---

## How to Enable Real-Time Data

### Step 1: Get Alpaca API Keys

1. Go to [Alpaca](https://alpaca.markets/)
2. Sign up for a **Paper Trading** account (free)
3. Go to Dashboard → API Keys
4. Generate new API keys:
   - **API Key ID**: `PKXXXXXXX`
   - **Secret Key**: `XXXXXXXXX`

### Step 2: Add to Environment Variables

Add these to your `.env` file:

```bash
ALPACA_API_KEY=your_api_key_here
ALPACA_SECRET_KEY=your_secret_key_here
```

### Step 3: Restart Your Application

```bash
npm run dev
```

### Step 4: Test

1. Go to **Contract Analyzer**
2. Analyze any contract (e.g., TSLA $250 Call)
3. Look at **Data Source Information** card
4. You should see:
   - 🟢 Live (if Alpaca is working)
   - ⚠️ Estimated (if using fallback)

---

## Verification

Check your server logs:
```bash
# With Alpaca configured:
✅ Using live Alpaca price for TSLA: $242.84
✅ Using live Alpaca contract data: $8.50

# Without Alpaca:
⚠️ Alpaca not configured, using estimated price: $242.84
⚠️ Using estimated price: $8.50
```

---

## Data Accuracy Levels

### Level 1: Estimates Only (Current Default)
- ⚠️ Stock prices: Static/hardcoded
- ⚠️ Contract prices: Calculated estimates
- ⚠️ Greeks: Simplified formulas (70-80% accurate)
- ⚠️ IV: Simulated
- **Use Case**: Demo, testing, learning

### Level 2: Live Alpaca Data
- 🟢 Stock prices: Real-time quotes
- 🟢 Contract prices: Live market data
- 🟢 Greeks: Exchange-provided (95%+ accurate)
- 🟢 IV: Real implied volatility
- **Use Case**: Paper trading, real analysis

### Level 3: Trained ML Models (Future)
- 🟢 Everything from Level 2
- 🤖 ML predictions from trained models
- 🤖 Historical pattern recognition
- 🤖 Advanced technical analysis
- **Use Case**: Production trading

---

## Testing Data Accuracy

### Test 1: Compare Stock Prices

1. Open any financial website (Yahoo Finance, Google Finance)
2. Check current price of TSLA
3. Compare with Contract Analyzer result
4. **With Alpaca**: Should match within seconds
5. **Without Alpaca**: Will be static/outdated

### Test 2: Compare Contract Prices

1. Open broker platform (Robinhood, TD Ameritrade, etc.)
2. Look up specific contract (e.g., TSLA $250 Call Dec-2025)
3. Compare bid/ask with Contract Analyzer
4. **With Alpaca**: Should match current market
5. **Without Alpaca**: Will be calculated estimate

### Test 3: Verify Greeks

1. Look up contract on Options calculator (e.g., Options Profit Calculator)
2. Compare Delta, Theta, Vega values
3. **With Alpaca**: Should match exchange data
4. **Without Alpaca**: Approximation (may vary 10-20%)

---

## What's Still Simulated (Even With Alpaca)

### ML Predictions
- **Status**: Simulated
- **Why**: Need to train models on historical data
- **To Fix**: Train actual ML models (see ML_MODEL_TRAINING.md)

### Future Price Targets
- **Status**: Random with logic
- **Why**: ML models not trained
- **To Fix**: Implement and train prediction models

### Technical Analysis Scores
- **Status**: Simulated
- **Why**: Need real indicator calculations
- **To Fix**: Integrate TA-Lib or similar

---

## Alpaca Options Data API

Alpaca provides:
- ✅ Real-time stock quotes
- ✅ Options chain snapshots
- ✅ Contract prices (bid/ask)
- ✅ Greeks (Delta, Gamma, Theta, Vega, Rho)
- ✅ Implied Volatility
- ✅ Volume & Open Interest

**API Limits** (Paper Account):
- 200 requests per minute
- Real-time data (15-minute delay on free tier)
- Unlimited paper trading

---

## Troubleshooting

### "⚠️ Estimated" showing when Alpaca is configured

**Check:**
1. Environment variables are set correctly
2. API keys are valid (not expired)
3. Server was restarted after adding keys
4. Check console logs for error messages

### "Contract not found in Alpaca"

**Possible reasons:**
1. Contract doesn't exist (invalid strike/date)
2. Contract is too far out of money
3. Low liquidity/volume contract
4. Weekend/market closed

**Solution**: System falls back to estimates automatically

---

## Production Checklist

Before going live with real trading:

- [ ] Alpaca API keys configured
- [ ] Real-time data verified (compare with broker)
- [ ] Greeks accuracy tested
- [ ] IV data validated
- [ ] ML models trained on historical data
- [ ] Backtesting completed
- [ ] Risk management tested
- [ ] Alerts configured
- [ ] Paper trading validated for 30+ days

---

## Next Steps

1. **Enable Alpaca** (this guide)
2. **Train ML Models** (see ML_MODEL_TRAINING.md)
3. **Backtest Strategies** (see BACKTESTING.md)
4. **Paper Trade** for validation
5. **Go Live** with confidence

---

## Support

If data accuracy issues persist:
1. Check server logs
2. Verify API keys
3. Test with known contract
4. Contact Alpaca support
5. Fall back to paper trading

Remember: **Always validate AI recommendations with your own research!**

