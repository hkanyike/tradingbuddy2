import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Asset Types table
export const assetTypes = sqliteTable('asset_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  typeName: text('type_name').notNull().unique(),
  description: text('description'),
  createdAt: text('created_at').notNull(),
});

// Assets table
export const assets = sqliteTable('assets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symbol: text('symbol').notNull().unique(),
  name: text('name').notNull(),
  assetTypeId: integer('asset_type_id').references(() => assetTypes.id),
  sector: text('sector'),
  liquidityRank: integer('liquidity_rank'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
});

// Strategies table
export const strategies = sqliteTable('strategies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  name: text('name').notNull(),
  strategyType: text('strategy_type'),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  config: text('config'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Positions table
export const positions = sqliteTable('positions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  strategyId: integer('strategy_id').references(() => strategies.id),
  assetId: integer('asset_id').references(() => assets.id),
  positionType: text('position_type').notNull(),
  quantity: integer('quantity').notNull(),
  entryPrice: real('entry_price').notNull(),
  currentPrice: real('current_price'),
  strikePrice: real('strike_price'),
  expirationDate: text('expiration_date'),
  delta: real('delta'),
  gamma: real('gamma'),
  theta: real('theta'),
  vega: real('vega'),
  iv: real('iv'),
  unrealizedPnl: real('unrealized_pnl').default(0),
  stopLoss: real('stop_loss'),
  takeProfit: real('take_profit'),
  status: text('status').default('open'),
  openedAt: text('opened_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Trades table
export const trades = sqliteTable('trades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  strategyId: integer('strategy_id').references(() => strategies.id),
  assetId: integer('asset_id').references(() => assets.id),
  positionId: integer('position_id').references(() => positions.id),
  tradeType: text('trade_type').notNull(),
  positionType: text('position_type'),
  quantity: integer('quantity').notNull(),
  entryPrice: real('entry_price'),
  exitPrice: real('exit_price'),
  strikePrice: real('strike_price'),
  expirationDate: text('expiration_date'),
  realizedPnl: real('realized_pnl').default(0),
  commission: real('commission').default(0),
  slippage: real('slippage').default(0),
  executedAt: text('executed_at').notNull(),
  closedAt: text('closed_at'),
});

// Alerts table
export const alerts = sqliteTable('alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  positionId: integer('position_id').references(() => positions.id),
  alertType: text('alert_type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  severity: text('severity').default('info'),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  isDismissed: integer('is_dismissed', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

// Risk Metrics table
export const riskMetrics = sqliteTable('risk_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  totalExposure: real('total_exposure').default(0),
  netDelta: real('net_delta').default(0),
  netGamma: real('net_gamma').default(0),
  netTheta: real('net_theta').default(0),
  netVega: real('net_vega').default(0),
  portfolioHeat: real('portfolio_heat').default(0),
  maxDrawdown: real('max_drawdown').default(0),
  dailyPnl: real('daily_pnl').default(0),
  sharpeRatio: real('sharpe_ratio'),
  sortinoRatio: real('sortino_ratio'),
  winRate: real('win_rate'),
  calculatedAt: text('calculated_at').notNull(),
});

// Broker Connections table
export const brokerConnections = sqliteTable('broker_connections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  brokerName: text('broker_name').notNull(),
  apiKeyEncrypted: text('api_key_encrypted'),
  isPaperTrading: integer('is_paper_trading', { mode: 'boolean' }).default(true),
  isConnected: integer('is_connected', { mode: 'boolean' }).default(false),
  lastConnectedAt: text('last_connected_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Market Signals table
export const marketSignals = sqliteTable('market_signals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  assetId: integer('asset_id').references(() => assets.id),
  signalType: text('signal_type').notNull(),
  strategyType: text('strategy_type'),
  confidenceScore: real('confidence_score'),
  recommendedAction: text('recommended_action'),
  ivPremium: real('iv_premium'),
  skew: real('skew'),
  termStructure: text('term_structure'),
  liquidityScore: real('liquidity_score'),
  riskRewardRatio: real('risk_reward_ratio'),
  isExecuted: integer('is_executed', { mode: 'boolean' }).default(false),
  validUntil: text('valid_until'),
  createdAt: text('created_at').notNull(),
});

// Add watchlist table
export const watchlist = sqliteTable('watchlist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  assetId: integer('asset_id').notNull().references(() => assets.id),
  addedAt: text('added_at').notNull(),
  notes: text('notes'),
  aiRecommended: integer('ai_recommended', { mode: 'boolean' }).default(false),
});

// Add watchlist_recommendations table with enhanced trading fields
export const watchlistRecommendations = sqliteTable('watchlist_recommendations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  assetId: integer('asset_id').notNull().references(() => assets.id),
  recommendationReason: text('recommendation_reason').notNull(),
  confidenceScore: real('confidence_score').notNull(),
  strategyId: integer('strategy_id').references(() => strategies.id),
  tradeAction: text('trade_action'),
  strikePrice: real('strike_price'),
  entryPrice: real('entry_price'),
  expirationDate: text('expiration_date'),
  potentialGain: real('potential_gain'),
  potentialGainPercentage: real('potential_gain_percentage'),
  potentialLoss: real('potential_loss'),
  potentialLossPercentage: real('potential_loss_percentage'),
  riskRewardRatio: real('risk_reward_ratio'),
  createdAt: text('created_at').notNull(),
  dismissed: integer('dismissed', { mode: 'boolean' }).default(false),
});

// Options Quotes table - Store real-time options chain data
export const optionsQuotes = sqliteTable('options_quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symbol: text('symbol').notNull(),
  optionSymbol: text('option_symbol').notNull(),
  strikePrice: real('strike_price').notNull(),
  expirationDate: text('expiration_date').notNull(),
  optionType: text('option_type').notNull(),
  bid: real('bid'),
  ask: real('ask'),
  lastPrice: real('last_price'),
  volume: integer('volume'),
  openInterest: integer('open_interest'),
  impliedVolatility: real('implied_volatility'),
  delta: real('delta'),
  gamma: real('gamma'),
  theta: real('theta'),
  vega: real('vega'),
  rho: real('rho'),
  underlyingPrice: real('underlying_price'),
  timestamp: text('timestamp').notNull(),
  createdAt: text('created_at').notNull(),
});

// Market Data Fetches table - Track data fetch jobs
export const marketDataFetches = sqliteTable('market_data_fetches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fetchType: text('fetch_type').notNull(),
  symbols: text('symbols').notNull(),
  status: text('status').notNull().default('pending'),
  recordsFetched: integer('records_fetched').default(0),
  errorMessage: text('error_message'),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
});

// IV Surface Snapshots table - Store IV surface data points
export const ivSurfaceSnapshots = sqliteTable('iv_surface_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symbol: text('symbol').notNull(),
  snapshotDate: text('snapshot_date').notNull(),
  expirationDate: text('expiration_date').notNull(),
  strikePrice: real('strike_price').notNull(),
  daysToExpiration: integer('days_to_expiration').notNull(),
  moneyness: real('moneyness').notNull(),
  impliedVolatility: real('implied_volatility').notNull(),
  optionType: text('option_type').notNull(),
  createdAt: text('created_at').notNull(),
});

// Add paper trading tables at the end
export const paperTradingAccounts = sqliteTable('paper_trading_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  cashBalance: real('cash_balance').notNull(),
  initialBalance: real('initial_balance').notNull(),
  totalEquity: real('total_equity').notNull(),
  totalPnl: real('total_pnl').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const paperOrders = sqliteTable('paper_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  paperAccountId: integer('paper_account_id').notNull().references(() => paperTradingAccounts.id),
  assetId: integer('asset_id').notNull().references(() => assets.id),
  orderType: text('order_type').notNull(),
  side: text('side').notNull(),
  quantity: integer('quantity').notNull(),
  limitPrice: real('limit_price'),
  stopPrice: real('stop_price'),
  status: text('status').notNull().default('pending'),
  filledQuantity: integer('filled_quantity').default(0),
  filledPrice: real('filled_price'),
  filledAt: text('filled_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const paperPositions = sqliteTable('paper_positions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  paperAccountId: integer('paper_account_id').notNull().references(() => paperTradingAccounts.id),
  assetId: integer('asset_id').notNull().references(() => assets.id),
  quantity: integer('quantity').notNull(),
  averageCost: real('average_cost').notNull(),
  currentPrice: real('current_price'),
  unrealizedPnl: real('unrealized_pnl').default(0),
  realizedPnl: real('realized_pnl').default(0),
  lastUpdated: text('last_updated').notNull(),
});

// Add ML models table
export const mlModels = sqliteTable('ml_models', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  modelType: text('model_type').notNull(),
  strategyId: integer('strategy_id').references(() => strategies.id),
  version: text('version').notNull(),
  status: text('status').notNull().default('training'),
  description: text('description'),
  hyperparameters: text('hyperparameters', { mode: 'json' }),
  featureImportance: text('feature_importance', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Add ML training runs table
export const mlTrainingRuns = sqliteTable('ml_training_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  modelId: integer('model_id').notNull().references(() => mlModels.id),
  userId: text('user_id').notNull().references(() => user.id),
  datasetStartDate: text('dataset_start_date').notNull(),
  datasetEndDate: text('dataset_end_date').notNull(),
  trainingSamples: integer('training_samples').notNull(),
  validationSamples: integer('validation_samples').notNull(),
  trainingMetrics: text('training_metrics', { mode: 'json' }).notNull(),
  validationMetrics: text('validation_metrics', { mode: 'json' }).notNull(),
  overfittingScore: real('overfitting_score'),
  trainingDurationSeconds: integer('training_duration_seconds').notNull(),
  status: text('status').notNull().default('running'),
  errorMessage: text('error_message'),
  createdAt: text('created_at').notNull(),
  completedAt: text('completed_at'),
});

// Add ML predictions table
export const mlPredictions = sqliteTable('ml_predictions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  modelId: integer('model_id').notNull().references(() => mlModels.id),
  assetId: integer('asset_id').notNull().references(() => assets.id),
  predictionType: text('prediction_type').notNull(),
  predictedValue: real('predicted_value').notNull(),
  confidenceScore: real('confidence_score').notNull(),
  featureVector: text('feature_vector', { mode: 'json' }).notNull(),
  actualValue: real('actual_value'),
  predictionError: real('prediction_error'),
  timestamp: text('timestamp').notNull(),
  validUntil: text('valid_until').notNull(),
});

// Add ML features table
export const mlFeatures = sqliteTable('ml_features', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  calculationFormula: text('calculation_formula'),
  importanceScore: real('importance_score'),
  createdAt: text('created_at').notNull(),
});

// Add backtests table
export const backtests = sqliteTable('backtests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  strategyId: integer('strategy_id').notNull().references(() => strategies.id),
  modelId: integer('model_id').references(() => mlModels.id),
  userId: text('user_id').notNull().references(() => user.id),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  initialCapital: real('initial_capital').notNull(),
  finalCapital: real('final_capital'),
  totalReturn: real('total_return'),
  sharpeRatio: real('sharpe_ratio'),
  sortinoRatio: real('sortino_ratio'),
  maxDrawdown: real('max_drawdown'),
  winRate: real('win_rate'),
  profitFactor: real('profit_factor'),
  totalTrades: integer('total_trades'),
  winningTrades: integer('winning_trades'),
  losingTrades: integer('losing_trades'),
  avgWin: real('avg_win'),
  avgLoss: real('avg_loss'),
  totalCommissions: real('total_commissions'),
  totalSlippage: real('total_slippage'),
  configuration: text('configuration', { mode: 'json' }).notNull(),
  status: text('status').notNull().default('running'),
  errorMessage: text('error_message'),
  createdAt: text('created_at').notNull(),
  completedAt: text('completed_at'),
});

// Add backtest trades table
export const backtestTrades = sqliteTable('backtest_trades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  backtestId: integer('backtest_id').notNull().references(() => backtests.id),
  assetId: integer('asset_id').notNull().references(() => assets.id),
  tradeType: text('trade_type').notNull(),
  side: text('side').notNull(),
  entryDate: text('entry_date').notNull(),
  exitDate: text('exit_date'),
  entryPrice: real('entry_price').notNull(),
  exitPrice: real('exit_price'),
  quantity: integer('quantity').notNull(),
  commission: real('commission').notNull(),
  slippage: real('slippage').notNull(),
  pnl: real('pnl'),
  pnlPercentage: real('pnl_percentage'),
  maxAdverseExcursion: real('max_adverse_excursion'),
  maxFavorableExcursion: real('max_favorable_excursion'),
  holdDurationHours: real('hold_duration_hours'),
  entrySignals: text('entry_signals', { mode: 'json' }).notNull(),
  exitReason: text('exit_reason'),
  greeksAtEntry: text('greeks_at_entry', { mode: 'json' }),
  greeksAtExit: text('greeks_at_exit', { mode: 'json' }),
});

// Add backtest daily metrics table
export const backtestDailyMetrics = sqliteTable('backtest_daily_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  backtestId: integer('backtest_id').notNull().references(() => backtests.id),
  date: text('date').notNull(),
  equity: real('equity').notNull(),
  cash: real('cash').notNull(),
  positionsValue: real('positions_value').notNull(),
  dailyPnl: real('daily_pnl').notNull(),
  dailyReturn: real('daily_return').notNull(),
  cumulativeReturn: real('cumulative_return').notNull(),
  drawdown: real('drawdown').notNull(),
  openPositions: integer('open_positions').notNull(),
  netDelta: real('net_delta'),
  netGamma: real('net_gamma'),
  netTheta: real('net_theta'),
  netVega: real('net_vega'),
  var95: real('var_95'),
});

// Add walk forward tests table
export const walkForwardTests = sqliteTable('walk_forward_tests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  modelId: integer('model_id').notNull().references(() => mlModels.id),
  strategyId: integer('strategy_id').notNull().references(() => strategies.id),
  userId: text('user_id').notNull().references(() => user.id),
  trainWindowDays: integer('train_window_days').notNull(),
  testWindowDays: integer('test_window_days').notNull(),
  totalWindows: integer('total_windows').notNull(),
  completedWindows: integer('completed_windows').notNull().default(0),
  avgInSampleSharpe: real('avg_in_sample_sharpe'),
  avgOutSampleSharpe: real('avg_out_sample_sharpe'),
  degradationRatio: real('degradation_ratio'),
  totalReturn: real('total_return'),
  maxDrawdown: real('max_drawdown'),
  resultsByWindow: text('results_by_window', { mode: 'json' }),
  status: text('status').notNull().default('running'),
  createdAt: text('created_at').notNull(),
  completedAt: text('completed_at'),
});

// Add volatility forecasts table
export const volatilityForecasts = sqliteTable('volatility_forecasts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  modelId: integer('model_id').notNull().references(() => mlModels.id),
  assetId: integer('asset_id').notNull().references(() => assets.id),
  forecastType: text('forecast_type').notNull(),
  forecastHorizonDays: integer('forecast_horizon_days').notNull(),
  forecastedVolatility: real('forecasted_volatility').notNull(),
  confidenceLower: real('confidence_lower').notNull(),
  confidenceUpper: real('confidence_upper').notNull(),
  realizedVolatility: real('realized_volatility'),
  forecastError: real('forecast_error'),
  timestamp: text('timestamp').notNull(),
});

// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  isAdmin: integer("is_admin", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  portfolioBalance: real("portfolio_balance").default(100000),
  riskTolerance: text("risk_tolerance").default("moderate"),
  executionMode: text("execution_mode").default("manual"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Add invite codes table at the end
export const inviteCodes = sqliteTable('invite_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  createdByUserId: text('created_by_user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  usedByUserId: text('used_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  maxUses: integer('max_uses').notNull().default(1),
  currentUses: integer('current_uses').notNull().default(0),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});