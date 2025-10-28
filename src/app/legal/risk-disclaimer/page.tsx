export default function RiskDisclaimerPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Risk Disclaimer</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 p-6 my-6 rounded-lg">
            <h2 className="text-red-700 dark:text-red-400 mt-0">⚠️ CRITICAL RISK WARNING</h2>
            <p className="text-red-600 dark:text-red-300 text-lg font-semibold">
              Options trading carries a high level of risk and may not be suitable for all investors. 
              You can lose all of your invested capital. Only trade with money you can afford to lose.
            </p>
          </div>

          <h2>Understanding Options Trading Risks</h2>
          
          <h3>1. Risk of Total Loss</h3>
          <p>
            Options can expire worthless, resulting in a total loss of the premium paid. Unlike stocks, 
            options have expiration dates, and time decay (theta) works against option buyers. Even if 
            your market outlook is correct, poor timing can result in losses.
          </p>

          <h3>2. Leverage and Amplified Risk</h3>
          <p>
            Options provide leverage, which amplifies both gains AND losses. A small move in the underlying 
            asset can result in a large percentage change in the option's value. While leverage can increase 
            profits, it can also magnify losses beyond your initial investment when selling options.
          </p>

          <h3>3. Complexity</h3>
          <p>
            Options are complex instruments influenced by multiple factors:
          </p>
          <ul>
            <li><strong>Delta:</strong> Sensitivity to price changes in the underlying asset</li>
            <li><strong>Gamma:</strong> Rate of change of delta</li>
            <li><strong>Theta:</strong> Time decay - options lose value as expiration approaches</li>
            <li><strong>Vega:</strong> Sensitivity to volatility changes</li>
            <li><strong>Rho:</strong> Sensitivity to interest rate changes</li>
          </ul>
          <p>
            Understanding these Greeks is essential but does not guarantee profitable trading.
          </p>

          <h3>4. Short Options Risk (Unlimited Loss Potential)</h3>
          <p>
            Selling (writing) naked options carries unlimited risk:
          </p>
          <ul>
            <li><strong>Short Calls:</strong> Theoretically unlimited loss if the underlying price rises</li>
            <li><strong>Short Puts:</strong> Substantial loss potential if the underlying price falls to zero</li>
          </ul>
          <p>
            You may be required to deposit additional margin or face forced liquidation at unfavorable prices.
          </p>

          <h3>5. Spread Risk</h3>
          <p>
            Multi-leg strategies (straddles, strangles, iron condors, butterflies) involve additional risks:
          </p>
          <ul>
            <li>Difficulty in closing positions before expiration</li>
            <li>Execution risk - one leg may fill while others don't</li>
            <li>Early assignment risk on short options</li>
            <li>Pin risk - uncertainty at expiration when price is near strike</li>
            <li>Higher commission costs</li>
          </ul>

          <h3>6. Liquidity Risk</h3>
          <p>
            Not all options have liquid markets. Wide bid-ask spreads can significantly impact your ability 
            to enter and exit positions at favorable prices. Illiquid options may be impossible to close 
            before expiration, forcing you to hold until expiry.
          </p>

          <h3>7. Volatility Risk (Vega)</h3>
          <p>
            Implied volatility (IV) significantly affects option prices. Even if the underlying price moves 
            in your favor, a decrease in IV (IV crush) can cause your option to lose value. This is especially 
            common after earnings announcements.
          </p>

          <h3>8. Assignment Risk</h3>
          <p>
            When you sell options, you may be assigned at any time before expiration:
          </p>
          <ul>
            <li>Short calls can be assigned early if the option is in-the-money and near ex-dividend date</li>
            <li>Assignment can happen without warning and may result in unexpected stock positions</li>
            <li>You must have sufficient capital or margin to handle assignment</li>
          </ul>

          <h3>9. Market Risk</h3>
          <p>
            Markets can be volatile and move against your position quickly:
          </p>
          <ul>
            <li>Gap risk - markets can open significantly higher or lower than the previous close</li>
            <li>Black swan events - rare, unpredictable events can cause extreme moves</li>
            <li>Systemic risk - overall market crashes affect most positions</li>
            <li>Sector-specific risk - industry news can impact all companies in a sector</li>
          </ul>

          <h3>10. Expiration Risk</h3>
          <p>
            Options expire, and their behavior near expiration is unpredictable:
          </p>
          <ul>
            <li>Accelerated time decay in the final days and hours</li>
            <li>Increased volatility as expiration approaches</li>
            <li>Pin risk - price settling near a strike price creates uncertainty</li>
            <li>Automatic exercise of in-the-money options may result in unwanted stock positions</li>
          </ul>

          <h2>Platform-Specific Risks</h2>

          <h3>Automated Trading Risks</h3>
          <p>
            Using AI-powered or automated trading strategies carries additional risks:
          </p>
          <ul>
            <li>Algorithms can malfunction and execute unintended trades</li>
            <li>Backtested results do not guarantee future performance</li>
            <li>System failures or bugs can result in losses</li>
            <li>Over-optimization (curve fitting) can lead to poor live performance</li>
            <li>Market conditions change - strategies that worked historically may fail</li>
          </ul>

          <h3>Paper Trading Limitations</h3>
          <p>
            Paper trading is simulated and does not reflect real-world conditions:
          </p>
          <ul>
            <li>No real capital at risk - removes emotional factors</li>
            <li>Perfect fills at mid-prices may not be realistic</li>
            <li>Assumes liquidity that may not exist in live markets</li>
            <li>Does not account for slippage, partial fills, or rejected orders</li>
            <li>Success in paper trading does NOT guarantee live trading success</li>
          </ul>

          <h3>Technology Risk</h3>
          <ul>
            <li>Internet connectivity issues can prevent order management</li>
            <li>Platform downtime during market hours</li>
            <li>Data feed delays or errors</li>
            <li>Broker API failures or rate limiting</li>
          </ul>

          <h2>Regulatory and Tax Considerations</h2>
          <ul>
            <li>Options trading is heavily regulated - understand the rules in your jurisdiction</li>
            <li>Pattern Day Trading (PDT) rules may apply if you make frequent day trades</li>
            <li>Tax treatment of options can be complex - consult a tax professional</li>
            <li>Wash sale rules may affect your ability to claim losses</li>
            <li>Short-term vs long-term capital gains have different tax rates</li>
          </ul>

          <h2>Recommendations for Risk Management</h2>
          <ul>
            <li><strong>Start small:</strong> Begin with small position sizes to learn</li>
            <li><strong>Use stop losses:</strong> Define your maximum loss before entering a trade</li>
            <li><strong>Diversify:</strong> Don't put all capital in one position or strategy</li>
            <li><strong>Understand Greeks:</strong> Know how your position will react to market changes</li>
            <li><strong>Monitor positions:</strong> Don't "set and forget" - actively manage risk</li>
            <li><strong>Paper trade first:</strong> Test strategies with virtual money before risking real capital</li>
            <li><strong>Continuous education:</strong> Keep learning about options and risk management</li>
            <li><strong>Have an exit plan:</strong> Know when you'll close positions (profit targets and stop losses)</li>
            <li><strong>Don't overtrade:</strong> Quality over quantity - wait for good setups</li>
            <li><strong>Keep emotions in check:</strong> Stick to your trading plan, avoid revenge trading</li>
          </ul>

          <h2>Disclaimer</h2>
          <p>
            This risk disclosure cannot cover all possible risks associated with options trading. 
            Before trading, you should:
          </p>
          <ul>
            <li>Read and understand your broker's options disclosure document</li>
            <li>Consult with financial and tax advisors</li>
            <li>Only trade with risk capital you can afford to lose completely</li>
            <li>Thoroughly understand any strategy before implementing it</li>
          </ul>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 my-6">
            <p className="font-semibold text-yellow-800 dark:text-yellow-300">
              By using Trading Buddy, you acknowledge that you have read, understood, and accept these risks. 
              You agree that all trading decisions are made solely by you and that Trading Buddy is not responsible 
              for any losses incurred.
            </p>
          </div>

          <h2>Required Reading</h2>
          <p>Before trading options, read:</p>
          <ul>
            <li>
              <a 
                href="https://www.theocc.com/Company-Information/Documents-and-Archives/Options-Disclosure-Document" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Characteristics and Risks of Standardized Options
              </a> (published by The Options Clearing Corporation)
            </li>
            <li>Your broker's options trading agreement and disclosures</li>
            <li>Trading Buddy <a href="/legal/terms" className="text-primary hover:underline">Terms of Service</a></li>
          </ul>

          <p className="text-sm text-muted-foreground mt-8">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </main>
    </div>
  );
}
