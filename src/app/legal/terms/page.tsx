export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Terms of Service</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Trading Buddy ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement.
            If you do not agree to these terms, please do not use this Platform.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Trading Buddy provides AI-powered options trading tools, including but not limited to:
          </p>
          <ul>
            <li>Paper trading simulation environment</li>
            <li>Automated trading strategy templates</li>
            <li>Real-time market data and analysis</li>
            <li>Options Greeks calculations and risk metrics</li>
            <li>Backtesting capabilities</li>
          </ul>

          <h2>3. Trading Risks Disclaimer</h2>
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 my-4">
            <p className="font-bold text-red-700 dark:text-red-400">IMPORTANT RISK WARNING</p>
            <p className="text-red-600 dark:text-red-300">
              Options trading involves substantial risk of loss and is not suitable for all investors. 
              Past performance is not indicative of future results. You may lose some or all of your invested capital.
              Trading on margin increases risks. Only risk capital you can afford to lose.
            </p>
          </div>

          <h2>4. No Investment Advice</h2>
          <p>
            Trading Buddy is a software tool and does NOT provide investment advice, financial planning, tax advice, 
            or legal advice. All trading decisions are made solely by you. We are not registered investment advisors 
            or broker-dealers. Consult with qualified professionals before making any investment decisions.
          </p>

          <h2>5. Paper Trading vs Live Trading</h2>
          <p>
            Paper trading results are simulated and do NOT represent actual trading. Simulated results may not reflect:
          </p>
          <ul>
            <li>Actual market conditions and liquidity</li>
            <li>Market impact of your orders</li>
            <li>Slippage and execution delays</li>
            <li>Emotional factors in real trading</li>
            <li>Margin requirements and forced liquidations</li>
          </ul>
          <p>
            Paper trading success does not guarantee live trading success. Start with small positions when transitioning to live trading.
          </p>

          <h2>6. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Provide accurate account information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Not use the Platform for illegal activities</li>
            <li>Not attempt to manipulate or abuse the Platform</li>
            <li>Not share your account with others</li>
          </ul>

          <h2>7. Broker Integration</h2>
          <p>
            If you connect third-party broker accounts, you authorize Trading Buddy to access your account data 
            and place orders on your behalf. You are responsible for:
          </p>
          <ul>
            <li>Verifying all orders before execution</li>
            <li>Maintaining sufficient funds in your brokerage account</li>
            <li>Understanding your broker's terms and conditions</li>
            <li>Monitoring your positions and risk exposure</li>
          </ul>

          <h2>8. Data and Privacy</h2>
          <p>
            Your use of the Platform is subject to our Privacy Policy. We collect and process data necessary 
            to provide our services. See our <a href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</a> for details.
          </p>

          <h2>9. Intellectual Property</h2>
          <p>
            All content, features, and functionality of Trading Buddy are owned by us and protected by 
            copyright, trademark, and other intellectual property laws. You may not copy, modify, 
            distribute, or reverse engineer any part of the Platform.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRADING BUDDY SHALL NOT BE LIABLE FOR ANY INDIRECT, 
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR 
            OTHER INTANGIBLE LOSSES ARISING FROM YOUR USE OF THE PLATFORM.
          </p>

          <h2>11. No Warranty</h2>
          <p>
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
            PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>

          <h2>12. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at any time for violation of these 
            terms or for any other reason. You may cancel your account at any time through the settings page.
          </p>

          <h2>13. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Changes will be effective immediately 
            upon posting. Your continued use of the Platform after changes constitutes acceptance of the new terms.
          </p>

          <h2>14. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of the jurisdiction 
            in which Trading Buddy operates, without regard to conflict of law principles.
          </p>

          <h2>15. Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact us at: legal@tradingbuddy.ai
          </p>
        </div>
      </main>
    </div>
  );
}
