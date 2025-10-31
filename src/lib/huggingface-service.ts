// Hugging Face ML inference service
export interface SentimentResult {
  label: string;
  score: number;
  sentiment: number; // -1 to 1
}

export interface ClassificationResult {
  label: string;
  score: number;
}

export class HuggingFaceService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api-inference.huggingface.co/models';
  
  // Pre-trained models
  private models = {
    sentiment: 'ProsusAI/finbert', // Financial sentiment analysis
    classification: 'yiyanghkust/finbert-tone', // Market tone classification
    zeroShot: 'facebook/bart-large-mnli' // Zero-shot classification
  };

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || null;
    console.log('Hugging Face API configured:', !!this.apiKey);
  }

  /**
   * Analyze sentiment of financial text
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    if (!this.apiKey) {
      console.log('⚠️ Hugging Face not configured, using fallback sentiment');
      return this.getFallbackSentiment(text);
    }

    try {
      const response = await this.query(this.models.sentiment, { inputs: text });
      return this.parseSentiment(response);
    } catch (error) {
      console.error('Hugging Face sentiment error:', error);
      return this.getFallbackSentiment(text);
    }
  }

  /**
   * Batch analyze sentiment for multiple texts
   */
  async analyzeSentimentBatch(texts: string[]): Promise<SentimentResult[]> {
    if (!this.apiKey) {
      return texts.map(t => this.getFallbackSentiment(t));
    }

    try {
      const results = await Promise.all(
        texts.map(text => this.analyzeSentiment(text))
      );
      return results;
    } catch (error) {
      console.error('Hugging Face batch sentiment error:', error);
      return texts.map(t => this.getFallbackSentiment(t));
    }
  }

  /**
   * Classify market tone
   */
  async classifyTone(text: string): Promise<ClassificationResult[]> {
    if (!this.apiKey) {
      return [{
        label: 'neutral',
        score: 0.5
      }];
    }

    try {
      const response = await this.query(this.models.classification, { inputs: text });
      return this.parseClassification(response);
    } catch (error) {
      console.error('Hugging Face classification error:', error);
      return [{
        label: 'neutral',
        score: 0.5
      }];
    }
  }

  /**
   * Zero-shot classification for custom categories
   */
  async classifyZeroShot(
    text: string,
    candidateLabels: string[]
  ): Promise<ClassificationResult[]> {
    if (!this.apiKey) {
      return candidateLabels.map(label => ({
        label,
        score: 1 / candidateLabels.length
      }));
    }

    try {
      const response = await this.query(this.models.zeroShot, {
        inputs: text,
        parameters: {
          candidate_labels: candidateLabels
        }
      });
      return this.parseZeroShot(response);
    } catch (error) {
      console.error('Hugging Face zero-shot error:', error);
      return candidateLabels.map(label => ({
        label,
        score: 1 / candidateLabels.length
      }));
    }
  }

  /**
   * Analyze news article sentiment
   */
  async analyzeNewsArticle(article: {
    title: string;
    content: string;
  }): Promise<{
    titleSentiment: SentimentResult;
    contentSentiment: SentimentResult;
    overallSentiment: number;
    category: string;
  }> {
    const titleSentiment = await this.analyzeSentiment(article.title);
    const contentSentiment = await this.analyzeSentiment(article.content);
    
    // Category classification
    const categories = await this.classifyZeroShot(
      article.title + ' ' + article.content.substring(0, 200),
      ['earnings', 'merger', 'regulatory', 'market', 'economic']
    );
    
    return {
      titleSentiment,
      contentSentiment,
      overallSentiment: (titleSentiment.sentiment * 0.4 + contentSentiment.sentiment * 0.6),
      category: categories[0]?.label || 'other'
    };
  }

  /**
   * Analyze market commentary
   */
  async analyzeMarketCommentary(commentary: string): Promise<{
    sentiment: SentimentResult;
    tone: ClassificationResult[];
    bullishScore: number;
    volatilityIndicator: number;
  }> {
    const sentiment = await this.analyzeSentiment(commentary);
    const tone = await this.classifyTone(commentary);
    
    // Determine bullish score
    const bullishScore = this.calculateBullishScore(sentiment, tone);
    
    // Determine volatility indicator
    const volatilityIndicator = this.calculateVolatilityIndicator(commentary);
    
    return {
      sentiment,
      tone,
      bullishScore,
      volatilityIndicator
    };
  }

  /**
   * Query Hugging Face API
   */
  private async query(model: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Parse sentiment response
   */
  private parseSentiment(response: any): SentimentResult {
    // FinBERT returns array of label/score pairs
    if (Array.isArray(response) && response.length > 0) {
      const result = response[0];
      if (Array.isArray(result)) {
        // Find the highest score
        const sorted = result.sort((a: any, b: any) => b.score - a.score);
        const top = sorted[0];
        
        return {
          label: top.label,
          score: top.score,
          sentiment: this.labelToSentiment(top.label)
        };
      }
    }
    
    // Fallback
    return {
      label: 'neutral',
      score: 0.5,
      sentiment: 0
    };
  }

  /**
   * Parse classification response
   */
  private parseClassification(response: any): ClassificationResult[] {
    if (Array.isArray(response) && response.length > 0) {
      const result = response[0];
      if (Array.isArray(result)) {
        return result.map((item: any) => ({
          label: item.label,
          score: item.score
        }));
      }
    }
    
    return [{
      label: 'neutral',
      score: 0.5
    }];
  }

  /**
   * Parse zero-shot response
   */
  private parseZeroShot(response: any): ClassificationResult[] {
    if (response.labels && response.scores) {
      return response.labels.map((label: string, index: number) => ({
        label,
        score: response.scores[index]
      }));
    }
    
    return [];
  }

  /**
   * Convert sentiment label to numeric score
   */
  private labelToSentiment(label: string): number {
    const lower = label.toLowerCase();
    if (lower.includes('positive') || lower.includes('bullish')) return 0.7;
    if (lower.includes('negative') || lower.includes('bearish')) return -0.7;
    if (lower.includes('neutral')) return 0;
    return 0;
  }

  /**
   * Calculate bullish score
   */
  private calculateBullishScore(sentiment: SentimentResult, tone: ClassificationResult[]): number {
    let score = sentiment.sentiment;
    
    // Adjust based on tone
    tone.forEach(t => {
      if (t.label.toLowerCase().includes('bullish')) {
        score += t.score * 0.3;
      } else if (t.label.toLowerCase().includes('bearish')) {
        score -= t.score * 0.3;
      }
    });
    
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Calculate volatility indicator
   */
  private calculateVolatilityIndicator(text: string): number {
    const volatilityKeywords = [
      'volatile', 'uncertainty', 'risk', 'swing', 'fluctuat',
      'unstable', 'turbulen', 'erratic', 'unpredictable'
    ];
    
    const lower = text.toLowerCase();
    let count = 0;
    
    volatilityKeywords.forEach(keyword => {
      if (lower.includes(keyword)) count++;
    });
    
    // Normalize to 0-1 scale
    return Math.min(1, count / 5);
  }

  /**
   * Fallback sentiment when API not configured
   */
  private getFallbackSentiment(text: string): SentimentResult {
    // Simple keyword-based sentiment
    const positiveWords = ['profit', 'gain', 'growth', 'beat', 'strong', 'upgrade'];
    const negativeWords = ['loss', 'decline', 'miss', 'weak', 'downgrade', 'risk'];
    
    const lower = text.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => {
      if (lower.includes(word)) score += 0.2;
    });
    
    negativeWords.forEach(word => {
      if (lower.includes(word)) score -= 0.2;
    });
    
    score = Math.max(-1, Math.min(1, score));
    
    return {
      label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
      score: Math.abs(score),
      sentiment: score
    };
  }
}

// Singleton instance
let huggingFaceService: HuggingFaceService | null = null;

export function getHuggingFaceService(): HuggingFaceService {
  if (!huggingFaceService) {
    huggingFaceService = new HuggingFaceService();
  }
  return huggingFaceService;
}

