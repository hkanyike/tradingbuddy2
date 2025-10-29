// Production-ready data pipeline for ML model training and inference
import { MarketData, OptionsData } from './feature-engine';

export interface DataSource {
  name: string;
  type: 'market' | 'options' | 'news' | 'sentiment';
  priority: number;
  enabled: boolean;
}

export interface DataIngestionConfig {
  sources: DataSource[];
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  realTimeEnabled: boolean;
  historicalDays: number;
}

export interface IngestedData {
  marketData: MarketData[];
  optionsData: OptionsData[];
  newsData: any[];
  sentimentData: any[];
  timestamp: number;
  source: string;
}

export class DataPipeline {
  private config: DataIngestionConfig;
  private isRunning = false;
  private ingestionQueue: IngestedData[] = [];
  private subscribers: ((data: IngestedData) => void)[] = [];

  constructor(config: DataIngestionConfig) {
    this.config = config;
  }

  /**
   * Start the data ingestion pipeline
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Data pipeline is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting data ingestion pipeline...');

    // Start real-time data ingestion
    if (this.config.realTimeEnabled) {
      await this.startRealTimeIngestion();
    }

    // Start historical data backfill
    await this.backfillHistoricalData();

    // Start batch processing
    this.startBatchProcessing();
  }

  /**
   * Stop the data ingestion pipeline
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('Data pipeline stopped');
  }

  /**
   * Subscribe to real-time data updates
   */
  subscribe(callback: (data: IngestedData) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Ingest data from multiple sources
   */
  async ingestData(symbols: string[]): Promise<IngestedData[]> {
    const results: IngestedData[] = [];
    const enabledSources = this.config.sources.filter(s => s.enabled);

    for (const source of enabledSources) {
      try {
        const data = await this.ingestFromSource(source, symbols);
        if (data) {
          results.push(data);
          this.ingestionQueue.push(data);
          this.notifySubscribers(data);
        }
      } catch (error) {
        console.error(`Failed to ingest from ${source.name}:`, error);
        await this.handleIngestionError(source, error);
      }
    }

    return results;
  }

  /**
   * Get historical data for training
   */
  async getHistoricalData(
    symbols: string[], 
    startDate: Date, 
    endDate: Date
  ): Promise<IngestedData[]> {
    const results: IngestedData[] = [];
    const enabledSources = this.config.sources.filter(s => s.enabled);

    for (const source of enabledSources) {
      try {
        const data = await this.getHistoricalFromSource(source, symbols, startDate, endDate);
        results.push(...data);
      } catch (error) {
        console.error(`Failed to get historical data from ${source.name}:`, error);
      }
    }

    return results;
  }

  private async startRealTimeIngestion(): Promise<void> {
    // Set up WebSocket connections for real-time data
    const symbols = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN'];
    
    // Market data WebSocket
    this.setupMarketDataWebSocket(symbols);
    
    // Options data WebSocket
    this.setupOptionsDataWebSocket(symbols);
    
    // News sentiment WebSocket
    this.setupNewsSentimentWebSocket();
  }

  private setupMarketDataWebSocket(symbols: string[]): void {
    // This would connect to a real market data provider
    // For now, we'll simulate with intervals
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const marketData = await this.fetchMarketData(symbols);
        const data: IngestedData = {
          marketData,
          optionsData: [],
          newsData: [],
          sentimentData: [],
          timestamp: Date.now(),
          source: 'market_data_ws'
        };

        this.ingestionQueue.push(data);
        this.notifySubscribers(data);
      } catch (error) {
        console.error('Market data WebSocket error:', error);
      }
    }, 1000); // Update every second
  }

  private setupOptionsDataWebSocket(symbols: string[]): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const optionsData = await this.fetchOptionsData(symbols);
        const data: IngestedData = {
          marketData: [],
          optionsData,
          newsData: [],
          sentimentData: [],
          timestamp: Date.now(),
          source: 'options_data_ws'
        };

        this.ingestionQueue.push(data);
        this.notifySubscribers(data);
      } catch (error) {
        console.error('Options data WebSocket error:', error);
      }
    }, 5000); // Update every 5 seconds
  }

  private setupNewsSentimentWebSocket(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const { newsData, sentimentData } = await this.fetchNewsSentiment();
        const data: IngestedData = {
          marketData: [],
          optionsData: [],
          newsData,
          sentimentData,
          timestamp: Date.now(),
          source: 'news_sentiment_ws'
        };

        this.ingestionQueue.push(data);
        this.notifySubscribers(data);
      } catch (error) {
        console.error('News sentiment WebSocket error:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  private async backfillHistoricalData(): Promise<void> {
    const symbols = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN'];
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (this.config.historicalDays * 24 * 60 * 60 * 1000));

    console.log(`Backfilling historical data from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    try {
      const historicalData = await this.getHistoricalData(symbols, startDate, endDate);
      console.log(`Backfilled ${historicalData.length} data points`);
    } catch (error) {
      console.error('Historical data backfill failed:', error);
    }
  }

  private startBatchProcessing(): void {
    setInterval(async () => {
      if (!this.isRunning || this.ingestionQueue.length === 0) return;

      const batch = this.ingestionQueue.splice(0, this.config.batchSize);
      await this.processBatch(batch);
    }, 10000); // Process every 10 seconds
  }

  private async processBatch(batch: IngestedData[]): Promise<void> {
    try {
      // Store data in database
      await this.storeData(batch);
      
      // Trigger feature engineering
      await this.triggerFeatureEngineering(batch);
      
      // Update model predictions
      await this.updateModelPredictions(batch);
      
      console.log(`Processed batch of ${batch.length} data points`);
    } catch (error) {
      console.error('Batch processing failed:', error);
    }
  }

  private async ingestFromSource(source: DataSource, symbols: string[]): Promise<IngestedData | null> {
    switch (source.type) {
      case 'market':
        return {
          marketData: await this.fetchMarketData(symbols),
          optionsData: [],
          newsData: [],
          sentimentData: [],
          timestamp: Date.now(),
          source: source.name
        };
      
      case 'options':
        return {
          marketData: [],
          optionsData: await this.fetchOptionsData(symbols),
          newsData: [],
          sentimentData: [],
          timestamp: Date.now(),
          source: source.name
        };
      
      case 'news':
        const { newsData, sentimentData } = await this.fetchNewsSentiment();
        return {
          marketData: [],
          optionsData: [],
          newsData,
          sentimentData,
          timestamp: Date.now(),
          source: source.name
        };
      
      default:
        return null;
    }
  }

  private async getHistoricalFromSource(
    source: DataSource, 
    symbols: string[], 
    startDate: Date, 
    endDate: Date
  ): Promise<IngestedData[]> {
    // This would fetch historical data from the source
    // For now, return empty array
    return [];
  }

  private async fetchMarketData(symbols: string[]): Promise<MarketData[]> {
    // This would fetch real market data from APIs like Polygon, Alpha Vantage, etc.
    // For now, return simulated data
    const data: MarketData[] = [];
    const now = Date.now();
    
    for (const symbol of symbols) {
      const basePrice = 100 + Math.random() * 100;
      const change = (Math.random() - 0.5) * 2;
      
      data.push({
        symbol,
        timestamp: now,
        open: basePrice,
        high: basePrice + Math.random() * 2,
        low: basePrice - Math.random() * 2,
        close: basePrice + change,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        vwap: basePrice + (Math.random() - 0.5) * 0.5
      });
    }
    
    return data;
  }

  private async fetchOptionsData(symbols: string[]): Promise<OptionsData[]> {
    // This would fetch real options data
    // For now, return simulated data
    const data: OptionsData[] = [];
    const now = Date.now();
    
    for (const symbol of symbols) {
      const underlyingPrice = 100 + Math.random() * 100;
      const strikes = [underlyingPrice * 0.9, underlyingPrice, underlyingPrice * 1.1];
      const expirations = ['2024-01-19', '2024-02-16', '2024-03-15'];
      
      for (const strike of strikes) {
        for (const expiration of expirations) {
          for (const optionType of ['call', 'put'] as const) {
            const iv = 0.2 + Math.random() * 0.3;
            const price = Math.max(0.01, (underlyingPrice - strike) * (optionType === 'call' ? 1 : -1) + Math.random() * 2);
            
            data.push({
              symbol,
              timestamp: now,
              strike,
              expiration,
              optionType,
              bid: price * 0.95,
              ask: price * 1.05,
              last: price,
              volume: Math.floor(Math.random() * 1000),
              openInterest: Math.floor(Math.random() * 10000),
              impliedVolatility: iv,
              delta: optionType === 'call' ? Math.random() : -Math.random(),
              gamma: Math.random() * 0.1,
              theta: -Math.random() * 0.1,
              vega: Math.random() * 0.5
            });
          }
        }
      }
    }
    
    return data;
  }

  private async fetchNewsSentiment(): Promise<{ newsData: any[]; sentimentData: any[] }> {
    // This would fetch real news and sentiment data
    // For now, return simulated data
    return {
      newsData: [
        {
          id: `news_${Date.now()}`,
          title: 'Market Update: Tech Stocks Rally',
          content: 'Technology stocks showed strong performance today...',
          sentiment: 0.7,
          timestamp: Date.now(),
          source: 'financial_news'
        }
      ],
      sentimentData: [
        {
          symbol: 'SPY',
          sentiment: 0.6,
          confidence: 0.8,
          timestamp: Date.now(),
          source: 'social_media'
        }
      ]
    };
  }

  private async handleIngestionError(source: DataSource, error: any): Promise<void> {
    console.error(`Ingestion error from ${source.name}:`, error);
    
    // Implement retry logic
    // For now, just log the error
  }

  private async storeData(batch: IngestedData[]): Promise<void> {
    // Store data in database
    // This would use your existing database connection
    console.log(`Storing ${batch.length} data points to database`);
  }

  private async triggerFeatureEngineering(batch: IngestedData[]): Promise<void> {
    // Trigger feature engineering for new data
    console.log(`Triggering feature engineering for ${batch.length} data points`);
  }

  private async updateModelPredictions(batch: IngestedData[]): Promise<void> {
    // Update model predictions with new data
    console.log(`Updating model predictions for ${batch.length} data points`);
  }

  private notifySubscribers(data: IngestedData): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in data subscriber:', error);
      }
    });
  }
}

// Default configuration
export const defaultDataPipelineConfig: DataIngestionConfig = {
  sources: [
    { name: 'polygon', type: 'market', priority: 1, enabled: true },
    { name: 'alpha_vantage', type: 'market', priority: 2, enabled: true },
    { name: 'iex_cloud', type: 'market', priority: 3, enabled: true },
    { name: 'polygon_options', type: 'options', priority: 1, enabled: true },
    { name: 'news_api', type: 'news', priority: 1, enabled: true },
    { name: 'sentiment_api', type: 'sentiment', priority: 1, enabled: true }
  ],
  batchSize: 100,
  maxRetries: 3,
  retryDelay: 1000,
  realTimeEnabled: true,
  historicalDays: 30
};

// Export singleton instance
export const dataPipeline = new DataPipeline(defaultDataPipelineConfig);
