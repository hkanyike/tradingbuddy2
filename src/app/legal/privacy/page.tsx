export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Information We Collect</h2>
          <h3>Personal Information</h3>
          <p>We collect information you provide directly to us, including:</p>
          <ul>
            <li>Account registration information (name, email address)</li>
            <li>Trading preferences and strategy configurations</li>
            <li>Broker API credentials (encrypted)</li>
            <li>Communication preferences</li>
          </ul>

          <h3>Usage Information</h3>
          <p>We automatically collect information about your use of the Platform:</p>
          <ul>
            <li>Trading activity and order history</li>
            <li>Paper trading performance metrics</li>
            <li>Feature usage and interaction patterns</li>
            <li>Device information and IP addresses</li>
            <li>Browser type and operating system</li>
          </ul>

          <h3>Market Data</h3>
          <p>We collect and process market data to provide our services:</p>
          <ul>
            <li>Real-time and historical price data</li>
            <li>Options chains and Greeks calculations</li>
            <li>Volatility surfaces and market signals</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide and maintain the Platform services</li>
            <li>Execute trades and manage your positions</li>
            <li>Calculate risk metrics and portfolio analytics</li>
            <li>Send important notifications and alerts</li>
            <li>Improve and personalize your experience</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
            <li>Communicate with you about updates and features</li>
          </ul>

          <h2>3. Information Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share information with:</p>
          
          <h3>Broker Partners</h3>
          <p>
            When you connect a broker account, we share necessary information to execute trades 
            and retrieve account data per your authorization.
          </p>

          <h3>Service Providers</h3>
          <p>
            We may share information with third-party service providers who assist in operating 
            the Platform (e.g., hosting, analytics, customer support).
          </p>

          <h3>Legal Requirements</h3>
          <p>We may disclose information if required by law, regulation, or legal process.</p>

          <h3>Business Transfers</h3>
          <p>
            In the event of a merger, acquisition, or sale of assets, user information may be 
            transferred as part of that transaction.
          </p>

          <h2>4. Data Security</h2>
          <p>We implement security measures to protect your information:</p>
          <ul>
            <li>Encryption of sensitive data in transit and at rest</li>
            <li>Secure storage of broker API credentials</li>
            <li>Regular security audits and monitoring</li>
            <li>Access controls and authentication requirements</li>
            <li>Secure data centers with redundancy</li>
          </ul>
          <p>
            However, no method of transmission over the Internet is 100% secure. We cannot 
            guarantee absolute security of your data.
          </p>

          <h2>5. Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or as needed to 
            provide services. We may retain certain information after account closure to:
          </p>
          <ul>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes</li>
            <li>Enforce our agreements</li>
            <li>Maintain business records</li>
          </ul>

          <h2>6. Your Rights and Choices</h2>
          <h3>Account Information</h3>
          <p>You can review and update your account information through the settings page.</p>

          <h3>Data Access and Portability</h3>
          <p>You have the right to request access to your personal data and receive a copy in a portable format.</p>

          <h3>Data Deletion</h3>
          <p>You can request deletion of your account and personal data, subject to legal retention requirements.</p>

          <h3>Communication Preferences</h3>
          <p>You can opt out of marketing communications while still receiving service-related messages.</p>

          <h2>7. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar technologies to:</p>
          <ul>
            <li>Maintain your session and authentication</li>
            <li>Remember your preferences</li>
            <li>Analyze usage patterns and improve the Platform</li>
            <li>Provide personalized content</li>
          </ul>
          <p>You can control cookies through your browser settings.</p>

          <h2>8. Third-Party Links</h2>
          <p>
            The Platform may contain links to third-party websites or services. We are not 
            responsible for the privacy practices of these external sites. Please review their 
            privacy policies before providing any information.
          </p>

          <h2>9. Children's Privacy</h2>
          <p>
            Trading Buddy is not intended for users under 18 years of age. We do not knowingly 
            collect information from children. If you believe we have collected information from 
            a child, please contact us immediately.
          </p>

          <h2>10. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. 
            We ensure appropriate safeguards are in place to protect your data in accordance with 
            this Privacy Policy.
          </p>

          <h2>11. California Privacy Rights</h2>
          <p>
            California residents have additional rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul>
            <li>Right to know what personal information is collected</li>
            <li>Right to know if personal information is sold or disclosed</li>
            <li>Right to opt-out of the sale of personal information</li>
            <li>Right to deletion of personal information</li>
            <li>Right to non-discrimination for exercising privacy rights</li>
          </ul>

          <h2>12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material 
            changes by posting the new policy on this page and updating the "Last Updated" date.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            For questions or concerns about this Privacy Policy or our data practices, contact us at:
          </p>
          <ul>
            <li>Email: privacy@tradingbuddy.ai</li>
            <li>Address: [Company Address]</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
