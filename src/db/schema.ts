import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: text("email_verified"),
  image: text("image"),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
  portfolioBalance: real("portfolio_balance").default(100000),
  riskTolerance: text("risk_tolerance").default("moderate"),
  executionMode: text("execution_mode").default("manual"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Asset types table
export const assetTypes = sqliteTable("asset_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Assets table
export const assets = sqliteTable("assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  assetTypeId: integer("asset_type_id").references(() => assetTypes.id),
  currentPrice: real("current_price"),
  marketCap: real("market_cap"),
  volume: integer("volume"),
  peRatio: real("pe_ratio"),
  dividendYield: real("dividend_yield"),
  beta: real("beta"),
  sector: text("sector"),
  industry: text("industry"),
  description: text("description"),
  website: text("website"),
  logoUrl: text("logo_url"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Strategies table
export const strategies = sqliteTable("strategies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'momentum', 'mean_reversion', 'arbitrage', etc.
  parameters: text("parameters"), // JSON string
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  performance: text("performance"), // JSON string with metrics
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Positions table
export const positions = sqliteTable("positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id),
  strategyId: integer("strategy_id").references(() => strategies.id),
  assetId: integer("asset_id").references(() => assets.id),
  positionType: text("position_type").notNull(),
  quantity: integer("quantity").notNull(),
  entryPrice: real("entry_price").notNull(),
  currentPrice: real("current_price"),
  strikePrice: real("strike_price"),
  expirationDate: text("expiration_date"),
  delta: real("delta"),
  gamma: real("gamma"),
  theta: real("theta"),
  vega: real("vega"),
  iv: real("iv"),
  unrealizedPnl: real("unrealized_pnl").default(0),
  stopLoss: real("stop_loss"),
  takeProfit: real("take_profit"),
  status: text("status").default("open"),
  openedAt: text("opened_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Trades table
export const trades = sqliteTable("trades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id),
  positionId: integer("position_id").references(() => positions.id),
  assetId: integer("asset_id").references(() => assets.id),
  tradeType: text("trade_type").notNull(), // 'buy', 'sell', 'open', 'close'
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  commission: real("commission").default(0),
  pnl: real("pnl").default(0),
  executedAt: text("executed_at").notNull(),
  createdAt: text("created_at").notNull(),
});

// Paper trading accounts table
export const paperTradingAccounts = sqliteTable("paper_trading_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id),
  cashBalance: real("cash_balance").notNull().default(100000),
  initialBalance: real("initial_balance").notNull().default(100000),
  totalEquity: real("total_equity").notNull().default(100000),
  totalPnl: real("total_pnl").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Paper trading positions table
export const paperPositions = sqliteTable("paper_positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paperAccountId: integer("paper_account_id").notNull().references(() => paperTradingAccounts.id),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  quantity: integer("quantity").notNull(),
  averageCost: real("average_cost").notNull(),
  currentPrice: real("current_price"),
  unrealizedPnl: real("unrealized_pnl").notNull().default(0),
  realizedPnl: real("realized_pnl").notNull().default(0),
  lastUpdated: text("last_updated").notNull(),
});

// Paper trading orders table
export const paperOrders = sqliteTable("paper_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paperAccountId: integer("paper_account_id").notNull().references(() => paperTradingAccounts.id),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  orderType: text("order_type").notNull(), // 'market' | 'limit' | 'stop'
  side: text("side").notNull(), // 'buy' | 'sell'
  quantity: integer("quantity").notNull(),
  limitPrice: real("limit_price"),
  stopPrice: real("stop_price"),
  status: text("status").notNull().default("pending"),
  filledQuantity: integer("filled_quantity").notNull().default(0),
  filledPrice: real("filled_price"),
  filledAt: text("filled_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Risk metrics table
export const riskMetrics = sqliteTable("risk_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id),
  portfolioValue: real("portfolio_value").notNull(),
  totalPnl: real("total_pnl").notNull(),
  dailyPnl: real("daily_pnl").notNull(),
  sharpeRatio: real("sharpe_ratio"),
  maxDrawdown: real("max_drawdown"),
  var95: real("var_95"),
  beta: real("beta"),
  volatility: real("volatility"),
  calculatedAt: text("calculated_at").notNull(),
  createdAt: text("created_at").notNull(),
});

// Alerts table
export const alerts = sqliteTable("alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id),
  type: text("type").notNull(), // 'price', 'volume', 'risk', 'news'
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  triggeredAt: text("triggered_at").notNull(),
  createdAt: text("created_at").notNull(),
});

// Watchlist table
export const watchlist = sqliteTable("watchlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  addedAt: text("added_at").notNull(),
  createdAt: text("created_at").notNull(),
});

// Watchlist recommendations table
export const watchlistRecommendations = sqliteTable("watchlist_recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  recommendationType: text("recommendation_type").notNull(), // 'ai', 'technical', 'fundamental'
  confidenceScore: real("confidence_score").notNull(),
  reasoning: text("reasoning").notNull(),
  isDismissed: integer("is_dismissed", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Broker connections table
export const brokerConnections = sqliteTable("broker_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id),
  brokerName: text("broker_name").notNull(),
  apiKey: text("api_key").notNull(),
  apiSecret: text("api_secret").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  lastSyncAt: text("last_sync_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Market signals table
export const marketSignals = sqliteTable("market_signals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  symbol: text("symbol").notNull(),
  signalType: text("signal_type").notNull(), // 'buy', 'sell', 'hold'
  strength: real("strength").notNull(), // 0-1
  confidence: real("confidence").notNull(), // 0-1
  reasoning: text("reasoning").notNull(),
  source: text("source").notNull(), // 'ai', 'technical', 'fundamental'
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at"),
});

// Backtests table
export const backtests = sqliteTable("backtests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id),
  strategyId: integer("strategy_id").references(() => strategies.id),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  initialCapital: real("initial_capital").notNull(),
  finalCapital: real("final_capital"),
  totalReturn: real("total_return"),
  totalReturnPercent: real("total_return_percent"),
  sharpeRatio: real("sharpe_ratio"),
  maxDrawdown: real("max_drawdown"),
  winRate: real("win_rate"),
  totalTrades: integer("total_trades"),
  parameters: text("parameters"), // JSON string
  results: text("results"), // JSON string with detailed results
  status: text("status").default("running"), // 'running', 'completed', 'failed'
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

// Backtest trades table
export const backtestTrades = sqliteTable("backtest_trades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  backtestId: integer("backtest_id").notNull().references(() => backtests.id),
  symbol: text("symbol").notNull(),
  tradeType: text("trade_type").notNull(),
  quantity: integer("quantity").notNull(),
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price"),
  pnl: real("pnl"),
  pnlPercent: real("pnl_percent"),
  entryTime: text("entry_time").notNull(),
  exitTime: text("exit_time"),
  duration: integer("duration"), // in minutes
  createdAt: text("created_at").notNull(),
});

// Walk forward tests table
export const walkForwardTests = sqliteTable("walk_forward_tests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id),
  strategyId: integer("strategy_id").references(() => strategies.id),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  trainingPeriod: integer("training_period").notNull(), // in days
  testingPeriod: integer("testing_period").notNull(), // in days
  stepSize: integer("step_size").notNull(), // in days
  totalReturn: real("total_return"),
  sharpeRatio: real("sharpe_ratio"),
  maxDrawdown: real("max_drawdown"),
  winRate: real("win_rate"),
  parameters: text("parameters"), // JSON string
  results: text("results"), // JSON string with detailed results
  status: text("status").default("running"),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

// Volatility forecasts table
export const volatilityForecasts = sqliteTable("volatility_forecasts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  modelId: integer("model_id").notNull(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  forecastType: text("forecast_type").notNull(),
  forecastHorizonDays: integer("forecast_horizon_days").notNull(),
  forecastedVolatility: real("forecasted_volatility").notNull(),
  confidenceLower: real("confidence_lower").notNull(),
  confidenceUpper: real("confidence_upper").notNull(),
  timestamp: text("timestamp").notNull(),
  realizedVolatility: real("realized_volatility"),
  forecastError: real("forecast_error"),
});

// ML Models table
export const mlModels = sqliteTable("ml_models", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  algorithm: text("algorithm").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("training"),
  metrics: text("metrics"), // JSON string
  hyperparameters: text("hyperparameters"), // JSON string
  trainingDataSize: integer("training_data_size").default(0),
  trainedAt: integer("trained_at").notNull(),
  modelPath: text("model_path"),
  featureImportance: text("feature_importance"), // JSON string
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ML Training runs table
export const mlTrainingRuns = sqliteTable("ml_training_runs", {
  id: text("id").primaryKey(),
  modelId: text("model_id").notNull().references(() => mlModels.id),
  experimentId: text("experiment_id"),
  runName: text("run_name").notNull(),
  status: text("status").notNull().default("running"),
  startTime: integer("start_time").notNull(),
  endTime: integer("end_time"),
  metrics: text("metrics"), // JSON string
  parameters: text("parameters"), // JSON string
  tags: text("tags"), // JSON string
  artifacts: text("artifacts"), // JSON string array
  createdAt: text("created_at").notNull(),
});

// ML Predictions table
export const mlPredictions = sqliteTable("ml_predictions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  modelId: text("model_id").notNull().references(() => mlModels.id),
  symbol: text("symbol").notNull(),
  prediction: real("prediction").notNull(),
  confidence: real("confidence").notNull(),
  features: text("features"), // JSON string
  actualValue: real("actual_value"),
  predictionError: real("prediction_error"),
  createdAt: text("created_at").notNull(),
});

// Accounts table (for credential-based auth records)
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id"),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  password: text("password"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: text("access_token_expires_at"),
  refreshTokenExpiresAt: text("refresh_token_expires_at"),
  scope: text("scope"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Options quotes table (for caching options market data)
export const optionsQuotes = sqliteTable("options_quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  symbol: text("symbol").notNull(),
  optionSymbol: text("option_symbol").notNull(),
  strikePrice: real("strike_price").notNull(),
  expirationDate: text("expiration_date").notNull(),
  optionType: text("option_type").notNull(), // 'call' | 'put'
  bid: real("bid"),
  ask: real("ask"),
  lastPrice: real("last_price"),
  volume: integer("volume"),
  openInterest: integer("open_interest"),
  impliedVolatility: real("implied_volatility"),
  delta: real("delta"),
  gamma: real("gamma"),
  theta: real("theta"),
  vega: real("vega"),
  rho: real("rho"),
  underlyingPrice: real("underlying_price"),
  timestamp: text("timestamp").notNull(),
  createdAt: text("created_at").notNull(),
});

// IV surface snapshots table
export const ivSurfaceSnapshots = sqliteTable("iv_surface_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  symbol: text("symbol").notNull(),
  snapshotDate: text("snapshot_date").notNull(),
  expirationDate: text("expiration_date").notNull(),
  strikePrice: real("strike_price").notNull(),
  daysToExpiration: integer("days_to_expiration").notNull(),
  moneyness: real("moneyness").notNull(),
  impliedVolatility: real("implied_volatility").notNull(),
  optionType: text("option_type").notNull(), // 'call' | 'put'
  createdAt: text("created_at").notNull(),
});

// Market data fetch logs (tracks external data pulls)
export const marketDataFetches = sqliteTable("market_data_fetches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Generic fields used across sources
  source: text("source"), // e.g., 'alpaca', 'polygon', 'alpha_vantage'
  endpoint: text("endpoint"),
  createdAt: text("created_at").notNull(),
  // Fields used by Alpaca options fetch route
  fetchType: text("fetch_type"), // e.g., 'options_chain'
  symbols: text("symbols"), // comma-separated list or single symbol
  status: text("status").notNull().default("in_progress"), // 'in_progress' | 'completed' | 'failed'
  recordsFetched: integer("records_fetched").default(0),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  errorMessage: text("error_message"),
});

// Invite codes table
export const inviteCodes = sqliteTable("invite_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  maxUses: integer("max_uses").notNull().default(1),
  currentUses: integer("current_uses").notNull().default(0),
  usedByUserId: text("used_by_user_id"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(user);
export const selectUserSchema = createSelectSchema(user);

export const insertAssetSchema = createInsertSchema(assets);
export const selectAssetSchema = createSelectSchema(assets);

export const insertPositionSchema = createInsertSchema(positions);
export const selectPositionSchema = createSelectSchema(positions);

export const insertTradeSchema = createInsertSchema(trades);
export const selectTradeSchema = createSelectSchema(trades);

export const insertStrategySchema = createInsertSchema(strategies);
export const selectStrategySchema = createSelectSchema(strategies);

export const insertRiskMetricsSchema = createInsertSchema(riskMetrics);
export const selectRiskMetricsSchema = createSelectSchema(riskMetrics);

export const insertAlertSchema = createInsertSchema(alerts);
export const selectAlertSchema = createSelectSchema(alerts);

export const insertWatchlistSchema = createInsertSchema(watchlist);
export const selectWatchlistSchema = createSelectSchema(watchlist);

export const insertWatchlistRecommendationSchema = createInsertSchema(watchlistRecommendations);
export const selectWatchlistRecommendationSchema = createSelectSchema(watchlistRecommendations);

export const insertBrokerConnectionSchema = createInsertSchema(brokerConnections);
export const selectBrokerConnectionSchema = createSelectSchema(brokerConnections);

export const insertMarketSignalSchema = createInsertSchema(marketSignals);
export const selectMarketSignalSchema = createSelectSchema(marketSignals);

export const insertBacktestSchema = createInsertSchema(backtests);
export const selectBacktestSchema = createSelectSchema(backtests);

export const insertBacktestTradeSchema = createInsertSchema(backtestTrades);
export const selectBacktestTradeSchema = createSelectSchema(backtestTrades);

export const insertWalkForwardTestSchema = createInsertSchema(walkForwardTests);
export const selectWalkForwardTestSchema = createSelectSchema(walkForwardTests);

export const insertMLModelSchema = createInsertSchema(mlModels);
export const selectMLModelSchema = createSelectSchema(mlModels);

export const insertMLTrainingRunSchema = createInsertSchema(mlTrainingRuns);
export const selectMLTrainingRunSchema = createSelectSchema(mlTrainingRuns);

export const insertMLPredictionSchema = createInsertSchema(mlPredictions);
export const selectMLPredictionSchema = createSelectSchema(mlPredictions);

// Type exports
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

export type Position = typeof positions.$inferSelect;
export type NewPosition = typeof positions.$inferInsert;

export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;

export type Strategy = typeof strategies.$inferSelect;
export type NewStrategy = typeof strategies.$inferInsert;

export type RiskMetrics = typeof riskMetrics.$inferSelect;
export type NewRiskMetrics = typeof riskMetrics.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

export type Watchlist = typeof watchlist.$inferSelect;
export type NewWatchlist = typeof watchlist.$inferInsert;

export type WatchlistRecommendation = typeof watchlistRecommendations.$inferSelect;
export type NewWatchlistRecommendation = typeof watchlistRecommendations.$inferInsert;

export type BrokerConnection = typeof brokerConnections.$inferSelect;
export type NewBrokerConnection = typeof brokerConnections.$inferInsert;

export type MarketSignal = typeof marketSignals.$inferSelect;
export type NewMarketSignal = typeof marketSignals.$inferInsert;

export type Backtest = typeof backtests.$inferSelect;
export type NewBacktest = typeof backtests.$inferInsert;

export type BacktestTrade = typeof backtestTrades.$inferSelect;
export type NewBacktestTrade = typeof backtestTrades.$inferInsert;

export type WalkForwardTest = typeof walkForwardTests.$inferSelect;
export type NewWalkForwardTest = typeof walkForwardTests.$inferInsert;

export type MLModel = typeof mlModels.$inferSelect;
export type NewMLModel = typeof mlModels.$inferInsert;

export type MLTrainingRun = typeof mlTrainingRuns.$inferSelect;
export type NewMLTrainingRun = typeof mlTrainingRuns.$inferInsert;

export type MLPrediction = typeof mlPredictions.$inferSelect;
export type NewMLPrediction = typeof mlPredictions.$inferInsert;