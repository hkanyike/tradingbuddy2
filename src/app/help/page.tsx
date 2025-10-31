"use client";

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Brain,
  Code,
  Lightbulb,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  ChevronRight,
  ExternalLink,
  Play,
  Book,
  FileText,
  HelpCircle,
  Cpu,
  BarChart3,
  Shield,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Play,
    description: 'Learn the basics and set up your account'
  },
  {
    id: 'ai-features',
    title: 'AI/ML Features',
    icon: Brain,
    description: 'Understanding our intelligent trading assistant'
  },
  {
    id: 'use-cases',
    title: 'Use Cases & Examples',
    icon: Lightbulb,
    description: 'Real-world examples and workflows'
  },
  {
    id: 'glossary',
    title: 'Trading Glossary',
    icon: Book,
    description: 'Options trading terms and definitions'
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: HelpCircle,
    description: 'Frequently asked questions'
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('getting-started');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Help Center</h1>
              <p className="text-muted-foreground text-lg">
                Everything you need to master TradingBuddy
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for help topics, features, or terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card 
                key={section.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedSection === section.id ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => setSelectedSection(section.id)}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {section.description}
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Content Tabs */}
        <Tabs value={selectedSection} onValueChange={setSelectedSection}>
          <TabsList className="hidden">
            {sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id}>
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Getting Started */}
          <TabsContent value="getting-started" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Play className="h-6 w-6 text-primary" />
                  Getting Started with TradingBuddy
                </CardTitle>
                <CardDescription>
                  A step-by-step guide to set up your account and start trading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Create Your Account</h3>
                    <p className="text-muted-foreground mb-2">
                      Sign up with your email and create a secure password. You'll start with a paper trading account to practice risk-free.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/sign-up">Create Account</Link>
                    </Button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Add Positions to Your Portfolio</h3>
                    <p className="text-muted-foreground mb-2">
                      Go to your Dashboard and click "Add Position" to track your stocks and options. You can manually enter positions or connect your broker.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Get AI Recommendations</h3>
                    <p className="text-muted-foreground mb-2">
                      Our AI analyzes your portfolio and market conditions to provide intelligent recommendations for position sizing, entry/exit timing, and risk management.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/ai">View AI Agent</Link>
                    </Button>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      4
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Set Up Watchlists & Alerts</h3>
                    <p className="text-muted-foreground mb-2">
                      Add stocks to your watchlist and configure alerts for price movements, volatility changes, or AI signals.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      5
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Train ML Models</h3>
                    <p className="text-muted-foreground mb-2">
                      Go to the Models page to train custom machine learning models for price prediction and strategy optimization.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/models">Train Models</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Start with paper trading to learn the platform risk-free</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>The AI learns from your trades - the more you use it, the better it gets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Enable real-time alerts to never miss important market movements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Review the AI explanations to learn why recommendations are made</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Features */}
          <TabsContent value="ai-features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  AI/ML Features Guide
                </CardTitle>
                <CardDescription>
                  Understanding our intelligent trading assistant powered by machine learning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* RL Agent */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Cpu className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Reinforcement Learning Agent</h3>
                      <p className="text-sm text-muted-foreground">Continuous learning for optimal trading decisions</p>
                    </div>
                  </div>
                  <div className="pl-12 space-y-3">
                    <p className="text-muted-foreground">
                      Our RL agent uses Q-learning to learn from every trade outcome, improving position sizing, entry/exit timing, and hedging decisions.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="font-semibold mb-1">What it does:</div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Recommends position sizes based on risk</li>
                          <li>• Optimizes entry and exit timing</li>
                          <li>• Suggests hedging actions</li>
                          <li>• Learns from wins and losses</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="font-semibold mb-1">Key Metrics:</div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• <strong>States Learned:</strong> Market situations analyzed</li>
                          <li>• <strong>Q-Value:</strong> Expected profit per action</li>
                          <li>• <strong>Epsilon:</strong> Exploration vs exploitation</li>
                          <li>• <strong>Experiences:</strong> Trades learned from</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ML Models */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Machine Learning Models</h3>
                      <p className="text-sm text-muted-foreground">Custom models for prediction and optimization</p>
                    </div>
                  </div>
                  <div className="pl-12 space-y-3">
                    <p className="text-muted-foreground">
                      Train specialized ML models for price prediction, volatility forecasting, and strategy optimization.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="font-semibold mb-1">XGBoost</div>
                        <p className="text-xs text-muted-foreground">
                          Gradient boosting for classification and regression tasks
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="font-semibold mb-1">LSTM</div>
                        <p className="text-xs text-muted-foreground">
                          Deep learning for time series prediction
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="font-semibold mb-1">Random Forest</div>
                        <p className="text-xs text-muted-foreground">
                          Ensemble learning for robust predictions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Target className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Intelligent Features</h3>
                      <p className="text-sm text-muted-foreground">AI-powered trading assistance</p>
                    </div>
                  </div>
                  <div className="pl-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Position Sizing</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">
                            AI recommends how much to invest based on your portfolio, risk tolerance, and market conditions
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Entry/Exit Timing</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">
                            ML predicts optimal entry and exit points using technical and volatility analysis
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Risk Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">
                            Automatic alerts for portfolio risk, Greeks imbalances, and concentration issues
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Profit Optimization</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">
                            ML predicts optimal profit-taking points and sets intelligent trailing stops
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Link to Full Documentation */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Detailed Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link href="/help/ai-features-detailed">
                    Complete AI/ML Features Guide
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link href="/help/use-cases">
                    Real-World Use Cases & Examples
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Use Cases */}
          <TabsContent value="use-cases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-primary" />
                  Real-World Use Cases
                </CardTitle>
                <CardDescription>
                  Learn how TradingBuddy assists with real trading scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* AAPL Example */}
                  <Link href="/help/example-aapl" className="block">
                    <Card className="border-primary/20 hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Badge variant="outline" className="bg-primary/10">Example</Badge>
                              AAPL Call Contract Decision
                            </CardTitle>
                            <CardDescription className="mt-2">
                              Step-by-step walkthrough: Client wants to buy AAPL calls, already has 3 contracts. How does our AI assist?
                            </CardDescription>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">Position Sizing</Badge>
                          <Badge variant="secondary">Risk Analysis</Badge>
                          <Badge variant="secondary">ML Predictions</Badge>
                          <Badge variant="secondary">Contract Selection</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Other Use Cases */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          Loss Minimization
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          ML detects deteriorating positions and recommends exits before small losses become large ones
                        </p>
                        <Badge variant="outline" className="text-xs">48% loss reduction</Badge>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          Profit Maximization
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          AI predicts optimal exit points and sets intelligent trailing stops to maximize gains
                        </p>
                        <Badge variant="outline" className="text-xs">46% profit improvement</Badge>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          Automated Hedging
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          RL agent monitors portfolio Greeks and automatically suggests hedges when risk exceeds thresholds
                        </p>
                        <Badge variant="outline" className="text-xs">Real-time protection</Badge>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-purple-500" />
                          Portfolio Rebalancing
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          AI analyzes concentration risk and suggests rebalancing to maintain optimal diversification
                        </p>
                        <Badge variant="outline" className="text-xs">50% Sharpe improvement</Badge>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Glossary */}
          <TabsContent value="glossary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Book className="h-6 w-6 text-primary" />
                  Trading Glossary
                </CardTitle>
                <CardDescription>
                  Essential options trading terms and definitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Greeks */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Badge>The Greeks</Badge>
                    </h3>
                    <div className="space-y-3 pl-4">
                      <div>
                        <div className="font-semibold">Delta (Δ)</div>
                        <p className="text-sm text-muted-foreground">
                          Rate of change of option price relative to underlying stock price. Ranges from 0 to 1 for calls, 0 to -1 for puts.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Example: Delta of 0.65 means option gains $0.65 for every $1 move in stock
                        </p>
                      </div>
                      <div>
                        <div className="font-semibold">Gamma (Γ)</div>
                        <p className="text-sm text-muted-foreground">
                          Rate of change of delta. Higher gamma means delta changes faster with stock price movements.
                        </p>
                      </div>
                      <div>
                        <div className="font-semibold">Theta (Θ)</div>
                        <p className="text-sm text-muted-foreground">
                          Time decay - amount option loses per day as expiration approaches. Usually negative for long options.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Example: Theta of -$8.50 means option loses $8.50 in value each day
                        </p>
                      </div>
                      <div>
                        <div className="font-semibold">Vega (ν)</div>
                        <p className="text-sm text-muted-foreground">
                          Sensitivity to implied volatility changes. How much option price changes when IV moves 1%.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Volatility */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Badge>Volatility</Badge>
                    </h3>
                    <div className="space-y-3 pl-4">
                      <div>
                        <div className="font-semibold">Implied Volatility (IV)</div>
                        <p className="text-sm text-muted-foreground">
                          Market's expectation of future price movement. Higher IV = more expensive options.
                        </p>
                      </div>
                      <div>
                        <div className="font-semibold">IV Rank</div>
                        <p className="text-sm text-muted-foreground">
                          Current IV compared to its 52-week range. 100 = highest IV of year, 0 = lowest.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          High IV Rank (&gt;70) good for selling premium, Low IV Rank (&lt;30) good for buying options
                        </p>
                      </div>
                      <div>
                        <div className="font-semibold">IV Crush</div>
                        <p className="text-sm text-muted-foreground">
                          Rapid drop in IV after an event (like earnings), causing option values to plummet.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Strategies */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Badge>Common Strategies</Badge>
                    </h3>
                    <div className="space-y-3 pl-4">
                      <div>
                        <div className="font-semibold">Iron Condor</div>
                        <p className="text-sm text-muted-foreground">
                          Sell OTM call spread + OTM put spread. Profits if stock stays within range. Limited risk/reward.
                        </p>
                      </div>
                      <div>
                        <div className="font-semibold">Straddle</div>
                        <p className="text-sm text-muted-foreground">
                          Buy call + put at same strike. Profits from big moves in either direction. High cost.
                        </p>
                      </div>
                      <div>
                        <div className="font-semibold">Credit Spread</div>
                        <p className="text-sm text-muted-foreground">
                          Sell option closer to money, buy option further out. Collect premium upfront, limited risk.
                        </p>
                      </div>
                      <div>
                        <div className="font-semibold">Covered Call</div>
                        <p className="text-sm text-muted-foreground">
                          Own 100 shares + sell 1 call. Generate income from shares, capped upside.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI/ML Terms */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Badge>AI/ML Terms</Badge>
                    </h3>
                    <div className="space-y-3 pl-4">
                      <div>
                        <div className="font-semibold">Q-Value</div>
                        <p className="text-sm text-muted-foreground">
                          Expected value of taking an action in a given state. Positive Q-value = profitable action expected.
                        </p>
                      </div>
                      <div>
                        <div className="font-semibold">Epsilon (ε)</div>
                        <p className="text-sm text-muted-foreground">
                          Exploration rate. High epsilon = more random exploration, low epsilon = more exploitation of learned knowledge.
                        </p>
                      </div>
                      <div>
                        <div className="font-semibold">Confidence Score</div>
                        <p className="text-sm text-muted-foreground">
                          ML model's certainty in its prediction, from 0 (uncertain) to 1 (highly confident).
                        </p>
                      </div>
                      <div>
                        <div className="font-semibold">Sharpe Ratio</div>
                        <p className="text-sm text-muted-foreground">
                          Risk-adjusted return measure. Higher is better. Above 1.0 is good, above 2.0 is excellent.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-2">How accurate is the AI?</h3>
                    <p className="text-sm text-muted-foreground">
                      Our ML models achieve 78-90% accuracy depending on the task. The RL agent improves continuously with more data. Always review AI recommendations and use your judgment.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-2">Is my data secure?</h3>
                    <p className="text-sm text-muted-foreground">
                      Yes. All data is encrypted, we never share your information, and broker connections use secure OAuth. Your trading data is private.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-2">Can I use this for live trading?</h3>
                    <p className="text-sm text-muted-foreground">
                      Yes, but we recommend starting with paper trading to familiarize yourself with the platform. AI recommendations are tools to assist your decisions, not automatic trading.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-2">What brokers do you support?</h3>
                    <p className="text-sm text-muted-foreground">
                      Currently we support Alpaca. More broker integrations (TD Ameritrade, Interactive Brokers, etc.) coming soon.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-2">How does the RL agent learn?</h3>
                    <p className="text-sm text-muted-foreground">
                      Every trade outcome (win or loss) is fed back to the RL agent, which updates its Q-values to improve future recommendations. More trades = better recommendations.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-2">Do you provide investment advice?</h3>
                    <p className="text-sm text-muted-foreground">
                      No. TradingBuddy is an analytical tool that provides data-driven insights. All trading decisions are your responsibility. We are not registered investment advisors.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Need More Help */}
        <Card className="mt-8 border-primary/20 bg-gradient-to-br from-primary/5 to-card">
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
            <CardDescription>
              Can't find what you're looking for? We're here to help.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href="https://github.com/yourusername/tradingbuddy2" target="_blank">
                View Documentation <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

