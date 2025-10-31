// OpenAI GPT-powered insights service
export interface TradeInsight {
  analysis: string;
  reasoning: string;
  risks: string[];
  opportunities: string[];
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  timeframe: string;
}

export interface MarketExplanation {
  topic: string;
  explanation: string;
  context: string;
  keyPoints: string[];
  relatedConcepts: string[];
}

export class OpenAIService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.openai.com/v1';
  private model = 'gpt-4-turbo-preview';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || null;
    console.log('OpenAI API configured:', !!this.apiKey);
  }

  /**
   * Get AI-powered trade analysis
   */
  async getTradeInsight(symbol: string, contractDetails: any): Promise<TradeInsight> {
    if (!this.apiKey) {
      console.log('⚠️ OpenAI not configured, using fallback analysis');
      return this.getFallbackInsight(symbol, contractDetails);
    }

    try {
      const prompt = this.buildTradePrompt(symbol, contractDetails);
      const completion = await this.callOpenAI(prompt);
      return this.parseTradeInsight(completion);
    } catch (error) {
      console.error('OpenAI error:', error);
      return this.getFallbackInsight(symbol, contractDetails);
    }
  }

  /**
   * Get market concept explanation
   */
  async explainConcept(concept: string, context?: string): Promise<MarketExplanation> {
    if (!this.apiKey) {
      console.log('⚠️ OpenAI not configured, using fallback explanation');
      return this.getFallbackExplanation(concept);
    }

    try {
      const prompt = `Explain the financial/trading concept "${concept}" in clear, concise terms suitable for an options trader.${context ? ` Context: ${context}` : ''} Include practical implications and related concepts.`;
      const completion = await this.callOpenAI(prompt);
      return this.parseExplanation(concept, completion);
    } catch (error) {
      console.error('OpenAI error:', error);
      return this.getFallbackExplanation(concept);
    }
  }

  /**
   * Generate personalized trading strategy explanation
   */
  async explainStrategy(
    strategyName: string,
    userContext: { riskTolerance: string; budget: number; experience: string }
  ): Promise<string> {
    if (!this.apiKey) {
      return `${strategyName} is an options trading strategy. For more details, consider enabling OpenAI integration for personalized explanations.`;
    }

    try {
      const prompt = `Explain the "${strategyName}" options trading strategy for a trader with ${userContext.riskTolerance} risk tolerance, $${userContext.budget} budget, and ${userContext.experience} experience level. Make it practical and actionable.`;
      const completion = await this.callOpenAI(prompt);
      return completion;
    } catch (error) {
      console.error('OpenAI error:', error);
      return `${strategyName} strategy explanation temporarily unavailable.`;
    }
  }

  /**
   * Analyze news sentiment with GPT
   */
  async analyzeNewsSentiment(articles: Array<{ title: string; summary: string }>): Promise<{
    overallSentiment: number;
    reasoning: string;
    keyThemes: string[];
  }> {
    if (!this.apiKey) {
      return {
        overallSentiment: 0,
        reasoning: 'OpenAI not configured',
        keyThemes: []
      };
    }

    try {
      const prompt = `Analyze the sentiment and key themes from these recent news articles. Return a sentiment score from -1 (very negative) to 1 (very positive) and identify key themes:\n\n${articles.map(a => `- ${a.title}: ${a.summary}`).join('\n')}`;
      const completion = await this.callOpenAI(prompt);
      return this.parseSentimentAnalysis(completion);
    } catch (error) {
      console.error('OpenAI error:', error);
      return {
        overallSentiment: 0,
        reasoning: 'Analysis failed',
        keyThemes: []
      };
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial analyst and options trading advisor. Provide clear, actionable insights based on market data and trading principles.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Build trade analysis prompt
   */
  private buildTradePrompt(symbol: string, details: any): string {
    return `Analyze this options trade for ${symbol}:
- Strike: $${details.strike}
- Expiration: ${details.expiration}
- Type: ${details.type}
- Current Price: $${details.currentPrice}
- IV: ${details.iv}%
- Greeks: Delta=${details.delta}, Theta=${details.theta}, Vega=${details.vega}

Provide: 1) Analysis, 2) Key risks, 3) Opportunities, 4) Recommendation (strong_buy/buy/hold/sell/strong_sell), 5) Confidence (0-1), 6) Timeframe.`;
  }

  /**
   * Parse trade insight from GPT response
   */
  private parseTradeInsight(response: string): TradeInsight {
    // Simple parsing - in production, you'd use structured output
    const lines = response.split('\n').filter(l => l.trim());
    
    return {
      analysis: lines[0] || response,
      reasoning: response,
      risks: this.extractList(response, 'risk'),
      opportunities: this.extractList(response, 'opportunit'),
      recommendation: this.extractRecommendation(response),
      confidence: this.extractConfidence(response),
      timeframe: this.extractTimeframe(response)
    };
  }

  /**
   * Parse explanation from GPT response
   */
  private parseExplanation(concept: string, response: string): MarketExplanation {
    const lines = response.split('\n').filter(l => l.trim());
    
    return {
      topic: concept,
      explanation: response,
      context: lines[0] || '',
      keyPoints: this.extractList(response, 'key point|important|note'),
      relatedConcepts: []
    };
  }

  /**
   * Parse sentiment analysis
   */
  private parseSentimentAnalysis(response: string): {
    overallSentiment: number;
    reasoning: string;
    keyThemes: string[];
  } {
    const sentimentMatch = response.match(/(-?\d+\.?\d*)/);
    const sentiment = sentimentMatch ? parseFloat(sentimentMatch[0]) : 0;
    
    return {
      overallSentiment: Math.max(-1, Math.min(1, sentiment)),
      reasoning: response,
      keyThemes: this.extractList(response, 'theme')
    };
  }

  /**
   * Extract list items from text
   */
  private extractList(text: string, keyword: string): string[] {
    const regex = new RegExp(`${keyword}[^:]*:([^\\n]+)`, 'gi');
    const matches = text.match(regex);
    if (!matches) return [];
    
    return matches
      .map(m => m.replace(regex, '$1').trim())
      .flatMap(m => m.split(','))
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  /**
   * Extract recommendation
   */
  private extractRecommendation(text: string): TradeInsight['recommendation'] {
    const lower = text.toLowerCase();
    if (lower.includes('strong buy') || lower.includes('strongly recommend buying')) return 'strong_buy';
    if (lower.includes('buy') || lower.includes('recommend buying')) return 'buy';
    if (lower.includes('strong sell') || lower.includes('strongly recommend selling')) return 'strong_sell';
    if (lower.includes('sell')) return 'sell';
    return 'hold';
  }

  /**
   * Extract confidence score
   */
  private extractConfidence(text: string): number {
    const match = text.match(/confidence[:\s]+(\d+)%/i);
    if (match) return parseInt(match[1]) / 100;
    
    // Fallback based on keywords
    const lower = text.toLowerCase();
    if (lower.includes('very confident') || lower.includes('highly confident')) return 0.9;
    if (lower.includes('confident')) return 0.75;
    if (lower.includes('moderate')) return 0.6;
    if (lower.includes('low confidence') || lower.includes('uncertain')) return 0.4;
    return 0.7;
  }

  /**
   * Extract timeframe
   */
  private extractTimeframe(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('day') || lower.includes('short-term')) return '1-7 days';
    if (lower.includes('week')) return '1-4 weeks';
    if (lower.includes('month')) return '1-3 months';
    if (lower.includes('long-term') || lower.includes('year')) return '3+ months';
    return '1-4 weeks';
  }

  /**
   * Fallback insight when OpenAI not configured
   */
  private getFallbackInsight(symbol: string, details: any): TradeInsight {
    return {
      analysis: `Basic analysis for ${symbol} ${details.type} option at $${details.strike}`,
      reasoning: 'Enable OpenAI for AI-powered insights',
      risks: ['Market volatility', 'Time decay', 'Adverse price movement'],
      opportunities: ['Potential profit from directional move', 'Leverage benefits'],
      recommendation: 'hold',
      confidence: 0.5,
      timeframe: '1-4 weeks'
    };
  }

  /**
   * Fallback explanation when OpenAI not configured
   */
  private getFallbackExplanation(concept: string): MarketExplanation {
    return {
      topic: concept,
      explanation: `${concept} is a trading concept. Enable OpenAI integration for detailed explanations.`,
      context: 'Explanation requires API key',
      keyPoints: [],
      relatedConcepts: []
    };
  }
}

// Singleton instance
let openAIService: OpenAIService | null = null;

export function getOpenAIService(): OpenAIService {
  if (!openAIService) {
    openAIService = new OpenAIService();
  }
  return openAIService;
}

