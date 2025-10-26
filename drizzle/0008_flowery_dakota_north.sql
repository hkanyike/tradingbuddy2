CREATE TABLE `backtest_daily_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`backtest_id` integer NOT NULL,
	`date` text NOT NULL,
	`equity` real NOT NULL,
	`cash` real NOT NULL,
	`positions_value` real NOT NULL,
	`daily_pnl` real NOT NULL,
	`daily_return` real NOT NULL,
	`cumulative_return` real NOT NULL,
	`drawdown` real NOT NULL,
	`open_positions` integer NOT NULL,
	`net_delta` real,
	`net_gamma` real,
	`net_theta` real,
	`net_vega` real,
	`var_95` real,
	FOREIGN KEY (`backtest_id`) REFERENCES `backtests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `backtest_trades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`backtest_id` integer NOT NULL,
	`asset_id` integer NOT NULL,
	`trade_type` text NOT NULL,
	`side` text NOT NULL,
	`entry_date` text NOT NULL,
	`exit_date` text,
	`entry_price` real NOT NULL,
	`exit_price` real,
	`quantity` integer NOT NULL,
	`commission` real NOT NULL,
	`slippage` real NOT NULL,
	`pnl` real,
	`pnl_percentage` real,
	`max_adverse_excursion` real,
	`max_favorable_excursion` real,
	`hold_duration_hours` real,
	`entry_signals` text NOT NULL,
	`exit_reason` text,
	`greeks_at_entry` text,
	`greeks_at_exit` text,
	FOREIGN KEY (`backtest_id`) REFERENCES `backtests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `backtests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`strategy_id` integer NOT NULL,
	`model_id` integer,
	`user_id` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`initial_capital` real NOT NULL,
	`final_capital` real,
	`total_return` real,
	`sharpe_ratio` real,
	`sortino_ratio` real,
	`max_drawdown` real,
	`win_rate` real,
	`profit_factor` real,
	`total_trades` integer,
	`winning_trades` integer,
	`losing_trades` integer,
	`avg_win` real,
	`avg_loss` real,
	`total_commissions` real,
	`total_slippage` real,
	`configuration` text NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`error_message` text,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`model_id`) REFERENCES `ml_models`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ml_features` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`calculation_formula` text,
	`importance_score` real,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ml_features_name_unique` ON `ml_features` (`name`);--> statement-breakpoint
CREATE TABLE `ml_models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`model_type` text NOT NULL,
	`strategy_id` integer,
	`version` text NOT NULL,
	`status` text DEFAULT 'training' NOT NULL,
	`description` text,
	`hyperparameters` text,
	`feature_importance` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ml_predictions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model_id` integer NOT NULL,
	`asset_id` integer NOT NULL,
	`prediction_type` text NOT NULL,
	`predicted_value` real NOT NULL,
	`confidence_score` real NOT NULL,
	`feature_vector` text NOT NULL,
	`actual_value` real,
	`prediction_error` real,
	`timestamp` text NOT NULL,
	`valid_until` text NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `ml_models`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ml_training_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`dataset_start_date` text NOT NULL,
	`dataset_end_date` text NOT NULL,
	`training_samples` integer NOT NULL,
	`validation_samples` integer NOT NULL,
	`training_metrics` text NOT NULL,
	`validation_metrics` text NOT NULL,
	`overfitting_score` real,
	`training_duration_seconds` integer NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`error_message` text,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`model_id`) REFERENCES `ml_models`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `volatility_forecasts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model_id` integer NOT NULL,
	`asset_id` integer NOT NULL,
	`forecast_type` text NOT NULL,
	`forecast_horizon_days` integer NOT NULL,
	`forecasted_volatility` real NOT NULL,
	`confidence_lower` real NOT NULL,
	`confidence_upper` real NOT NULL,
	`realized_volatility` real,
	`forecast_error` real,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `ml_models`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `walk_forward_tests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`model_id` integer NOT NULL,
	`strategy_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`train_window_days` integer NOT NULL,
	`test_window_days` integer NOT NULL,
	`total_windows` integer NOT NULL,
	`completed_windows` integer DEFAULT 0 NOT NULL,
	`avg_in_sample_sharpe` real,
	`avg_out_sample_sharpe` real,
	`degradation_ratio` real,
	`total_return` real,
	`max_drawdown` real,
	`results_by_window` text,
	`status` text DEFAULT 'running' NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`model_id`) REFERENCES `ml_models`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
