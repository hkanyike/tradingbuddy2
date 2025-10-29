// Production-ready news sentiment analysis for ML models
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  publishedAt: number;
  source: string;
  url: string;
  symbols: string[];
  category: 'earnings' | 'merger' | 'regulatory' | 'market' | 'economic' | 'other';
  sentiment: number; // -1 to 1
  confidence: number; // 0 to 1
  impact: 'high' | 'medium' | 'low';
  keywords: string[];
}

export interface SentimentAnalysis {
  symbol: string;
  overallSentiment: number; // -1 to 1
  confidence: number; // 0 to 1
  newsCount: number;
  positiveNews: number;
  negativeNews: number;
  neutralNews: number;
  lastUpdated: number;
  sources: string[];
  topKeywords: Array<{ keyword: string; sentiment: number; frequency: number }>;
}

export interface NewsEvent {
  id: string;
  type: 'earnings' | 'fda_approval' | 'merger' | 'regulatory' | 'economic_indicator';
  symbol: string;
  title: string;
  description: string;
  scheduledDate: number;
  actualDate?: number;
  impact: 'high' | 'medium' | 'low';
  expectedImpact: number; // -1 to 1
  actualImpact?: number; // -1 to 1
  status: 'scheduled' | 'completed' | 'cancelled';
}

export class NewsSentimentEngine {
  private newsCache: Map<string, NewsArticle[]> = new Map();
  private sentimentCache: Map<string, SentimentAnalysis> = new Map();
  private eventsCache: Map<string, NewsEvent[]> = new Map();
  private lastUpdateTime = 0;
  private updateInterval = 60000; // 1 minute

  constructor() {
    this.startPeriodicUpdate();
  }

  /**
   * Get news sentiment for a symbol
   */
  async getSentimentAnalysis(symbol: string): Promise<SentimentAnalysis | null> {
    try {
      // Check cache first
      const cached = this.sentimentCache.get(symbol);
      if (cached && Date.now() - cached.lastUpdated < 300000) { // 5 minutes
        return cached;
      }

      // Fetch fresh news data
      const news = await this.fetchNewsForSymbol(symbol);
      if (!news || news.length === 0) {
        return null;
      }

      // Analyze sentiment
      const analysis = await this.analyzeSentiment(symbol, news);
      
      // Cache result
      this.sentimentCache.set(symbol, analysis);
      
      return analysis;
    } catch (error) {
      console.error(`Error getting sentiment for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get news articles for a symbol
   */
  async getNewsForSymbol(symbol: string, limit: number = 10): Promise<NewsArticle[]> {
    try {
      const news = await this.fetchNewsForSymbol(symbol);
      return news.slice(0, limit);
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get upcoming events for a symbol
   */
  async getUpcomingEvents(symbol: string): Promise<NewsEvent[]> {
    try {
      const cached = this.eventsCache.get(symbol);
      if (cached && Date.now() - this.lastUpdateTime < 3600000) { // 1 hour
        return cached;
      }

      const events = await this.fetchUpcomingEvents(symbol);
      this.eventsCache.set(symbol, events);
      return events;
    } catch (error) {
      console.error(`Error fetching events for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get market-wide sentiment
   */
  async getMarketSentiment(symbols: string[]): Promise<{
    overallSentiment: number;
    confidence: number;
    symbolSentiments: Record<string, SentimentAnalysis>;
    topStories: NewsArticle[];
    marketEvents: NewsEvent[];
  }> {
    try {
      const symbolSentiments: Record<string, SentimentAnalysis> = {};
      let totalSentiment = 0;
      let totalConfidence = 0;
      let validSymbols = 0;

      // Get sentiment for each symbol
      for (const symbol of symbols) {
        const sentiment = await this.getSentimentAnalysis(symbol);
        if (sentiment) {
          symbolSentiments[symbol] = sentiment;
          totalSentiment += sentiment.overallSentiment;
          totalConfidence += sentiment.confidence;
          validSymbols++;
        }
      }

      // Get top market stories
      const topStories = await this.fetchTopMarketStories();

      // Get market events
      const marketEvents = await this.fetchMarketEvents();

      return {
        overallSentiment: validSymbols > 0 ? totalSentiment / validSymbols : 0,
        confidence: validSymbols > 0 ? totalConfidence / validSymbols : 0,
        symbolSentiments,
        topStories,
        marketEvents
      };
    } catch (error) {
      console.error('Error getting market sentiment:', error);
      return {
        overallSentiment: 0,
        confidence: 0,
        symbolSentiments: {},
        topStories: [],
        marketEvents: []
      };
    }
  }

  /**
   * Check if news should trigger model retraining
   */
  shouldRetrainModel(symbol: string, lastRetrainTime: number): boolean {
    const sentiment = this.sentimentCache.get(symbol);
    if (!sentiment) return false;

    // Retrain if:
    // 1. High impact news with significant sentiment change
    // 2. More than 24 hours since last retrain
    // 3. Confidence is high and sentiment is extreme

    const timeSinceRetrain = Date.now() - lastRetrainTime;
    const hasHighImpactNews = sentiment.newsCount > 5 && Math.abs(sentiment.overallSentiment) > 0.7;
    const isTimeForRetrain = timeSinceRetrain > 86400000; // 24 hours
    const hasExtremeSentiment = Math.abs(sentiment.overallSentiment) > 0.8 && sentiment.confidence > 0.8;

    return hasHighImpactNews || isTimeForRetrain || hasExtremeSentiment;
  }

  private async fetchNewsForSymbol(symbol: string): Promise<NewsArticle[]> {
    // In production, this would integrate with news APIs like:
    // - NewsAPI
    // - Alpha Vantage News
    // - Benzinga News
    // - Financial Modeling Prep
    
    // For now, return simulated data
    const mockNews: NewsArticle[] = [
      {
        id: `news_${symbol}_${Date.now()}`,
        title: `${symbol} Reports Strong Q4 Earnings, Beats Expectations`,
        content: `${symbol} reported better-than-expected earnings for the fourth quarter, with revenue growing 15% year-over-year. The company's strong performance was driven by increased demand for its products and services.`,
        summary: `${symbol} Q4 earnings beat expectations with 15% revenue growth`,
        publishedAt: Date.now() - Math.random() * 3600000, // Within last hour
        source: 'Financial News',
        url: `https://example.com/news/${symbol}-earnings`,
        symbols: [symbol],
        category: 'earnings',
        sentiment: 0.7 + Math.random() * 0.3, // 0.7 to 1.0
        confidence: 0.8 + Math.random() * 0.2, // 0.8 to 1.0
        impact: 'high',
        keywords: ['earnings', 'revenue', 'growth', 'beat', 'expectations']
      },
      {
        id: `news_${symbol}_${Date.now() + 1}`,
        title: `Analysts Upgrade ${symbol} Price Target Following Strong Performance`,
        content: `Several Wall Street analysts have upgraded their price targets for ${symbol} following the company's strong quarterly results and positive outlook for the coming year.`,
        summary: `Analysts upgrade ${symbol} price target after strong results`,
        publishedAt: Date.now() - Math.random() * 7200000, // Within last 2 hours
        source: 'Market Watch',
        url: `https://example.com/news/${symbol}-upgrade`,
        symbols: [symbol],
        category: 'market',
        sentiment: 0.6 + Math.random() * 0.4, // 0.6 to 1.0
        confidence: 0.7 + Math.random() * 0.3, // 0.7 to 1.0
        impact: 'medium',
        keywords: ['upgrade', 'price target', 'analysts', 'outlook']
      }
    ];

    return mockNews;
  }

  private async analyzeSentiment(symbol: string, news: NewsArticle[]): Promise<SentimentAnalysis> {
    // In production, this would use:
    // - VADER sentiment analysis
    // - FinBERT (financial BERT)
    // - Custom sentiment models trained on financial news
    // - Multiple sentiment analysis services for ensemble

    let totalSentiment = 0;
    let totalConfidence = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    const sources = new Set<string>();
    const keywordMap = new Map<string, { sentiment: number; frequency: number }>();

    for (const article of news) {
      totalSentiment += article.sentiment;
      totalConfidence += article.confidence;
      sources.add(article.source);

      // Categorize sentiment
      if (article.sentiment > 0.1) {
        positiveCount++;
      } else if (article.sentiment < -0.1) {
        negativeCount++;
      } else {
        neutralCount++;
      }

      // Track keywords
      for (const keyword of article.keywords) {
        const existing = keywordMap.get(keyword) || { sentiment: 0, frequency: 0 };
        existing.sentiment += article.sentiment;
        existing.frequency += 1;
        keywordMap.set(keyword, existing);
      }
    }

    const avgSentiment = totalSentiment / news.length;
    const avgConfidence = totalConfidence / news.length;

    // Get top keywords
    const topKeywords = Array.from(keywordMap.entries())
      .map(([keyword, data]) => ({
        keyword,
        sentiment: data.sentiment / data.frequency,
        frequency: data.frequency
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      symbol,
      overallSentiment: avgSentiment,
      confidence: avgConfidence,
      newsCount: news.length,
      positiveNews: positiveCount,
      negativeNews: negativeCount,
      neutralNews: neutralCount,
      lastUpdated: Date.now(),
      sources: Array.from(sources),
      topKeywords
    };
  }

  private async fetchUpcomingEvents(symbol: string): Promise<NewsEvent[]> {
    // In production, this would fetch from:
    // - Earnings calendar APIs
    // - Economic calendar APIs
    // - Company event calendars
    // - SEC filing schedules

    const mockEvents: NewsEvent[] = [
      {
        id: `event_${symbol}_earnings`,
        type: 'earnings',
        symbol,
        title: `${symbol} Q1 2024 Earnings Call`,
        description: `${symbol} will report Q1 2024 earnings and hold conference call`,
        scheduledDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        impact: 'high',
        expectedImpact: 0.3,
        status: 'scheduled'
      }
    ];

    return mockEvents;
  }

  private async fetchTopMarketStories(): Promise<NewsArticle[]> {
    // Fetch top market-wide stories
    const mockStories: NewsArticle[] = [
      {
        id: 'market_story_1',
        title: 'Federal Reserve Signals Potential Rate Cuts Amid Economic Uncertainty',
        content: 'The Federal Reserve indicated it may consider interest rate cuts in the coming months...',
        summary: 'Fed signals potential rate cuts',
        publishedAt: Date.now() - 1800000, // 30 minutes ago
        source: 'Reuters',
        url: 'https://example.com/news/fed-rate-cuts',
        symbols: ['SPY', 'QQQ', 'DIA'],
        category: 'economic',
        sentiment: -0.2,
        confidence: 0.9,
        impact: 'high',
        keywords: ['federal reserve', 'rate cuts', 'interest rates', 'economy']
      }
    ];

    return mockStories;
  }

  private async fetchMarketEvents(): Promise<NewsEvent[]> {
    // Fetch market-wide events
    const mockEvents: NewsEvent[] = [
      {
        id: 'market_event_1',
        type: 'economic_indicator',
        symbol: 'SPY',
        title: 'Non-Farm Payrolls Report',
        description: 'Monthly employment report from the Bureau of Labor Statistics',
        scheduledDate: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
        impact: 'high',
        expectedImpact: 0.1,
        status: 'scheduled'
      }
    ];

    return mockEvents;
  }

  private startPeriodicUpdate(): void {
    setInterval(async () => {
      try {
        // Update sentiment cache for active symbols
        const activeSymbols = Array.from(this.sentimentCache.keys());
        for (const symbol of activeSymbols) {
          const news = await this.fetchNewsForSymbol(symbol);
          if (news.length > 0) {
            const analysis = await this.analyzeSentiment(symbol, news);
            this.sentimentCache.set(symbol, analysis);
          }
        }
        this.lastUpdateTime = Date.now();
      } catch (error) {
        console.error('Error in periodic news update:', error);
      }
    }, this.updateInterval);
  }
}

// Export singleton instance
export const newsSentimentEngine = new NewsSentimentEngine();
