DROP TABLE `users`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_alerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`position_id` integer,
	`alert_type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`severity` text DEFAULT 'info',
	`is_read` integer DEFAULT false,
	`is_dismissed` integer DEFAULT false,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_alerts`("id", "user_id", "position_id", "alert_type", "title", "message", "severity", "is_read", "is_dismissed", "created_at") SELECT "id", "user_id", "position_id", "alert_type", "title", "message", "severity", "is_read", "is_dismissed", "created_at" FROM `alerts`;--> statement-breakpoint
DROP TABLE `alerts`;--> statement-breakpoint
ALTER TABLE `__new_alerts` RENAME TO `alerts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_broker_connections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`broker_name` text NOT NULL,
	`api_key_encrypted` text,
	`is_paper_trading` integer DEFAULT true,
	`is_connected` integer DEFAULT false,
	`last_connected_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_broker_connections`("id", "user_id", "broker_name", "api_key_encrypted", "is_paper_trading", "is_connected", "last_connected_at", "created_at", "updated_at") SELECT "id", "user_id", "broker_name", "api_key_encrypted", "is_paper_trading", "is_connected", "last_connected_at", "created_at", "updated_at" FROM `broker_connections`;--> statement-breakpoint
DROP TABLE `broker_connections`;--> statement-breakpoint
ALTER TABLE `__new_broker_connections` RENAME TO `broker_connections`;--> statement-breakpoint
CREATE TABLE `__new_paper_trading_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`cash_balance` real NOT NULL,
	`initial_balance` real NOT NULL,
	`total_equity` real NOT NULL,
	`total_pnl` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_paper_trading_accounts`("id", "user_id", "cash_balance", "initial_balance", "total_equity", "total_pnl", "is_active", "created_at", "updated_at") SELECT "id", "user_id", "cash_balance", "initial_balance", "total_equity", "total_pnl", "is_active", "created_at", "updated_at" FROM `paper_trading_accounts`;--> statement-breakpoint
DROP TABLE `paper_trading_accounts`;--> statement-breakpoint
ALTER TABLE `__new_paper_trading_accounts` RENAME TO `paper_trading_accounts`;--> statement-breakpoint
CREATE TABLE `__new_positions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`strategy_id` integer,
	`asset_id` integer,
	`position_type` text NOT NULL,
	`quantity` integer NOT NULL,
	`entry_price` real NOT NULL,
	`current_price` real,
	`strike_price` real,
	`expiration_date` text,
	`delta` real,
	`gamma` real,
	`theta` real,
	`vega` real,
	`iv` real,
	`unrealized_pnl` real DEFAULT 0,
	`stop_loss` real,
	`take_profit` real,
	`status` text DEFAULT 'open',
	`opened_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_positions`("id", "user_id", "strategy_id", "asset_id", "position_type", "quantity", "entry_price", "current_price", "strike_price", "expiration_date", "delta", "gamma", "theta", "vega", "iv", "unrealized_pnl", "stop_loss", "take_profit", "status", "opened_at", "updated_at") SELECT "id", "user_id", "strategy_id", "asset_id", "position_type", "quantity", "entry_price", "current_price", "strike_price", "expiration_date", "delta", "gamma", "theta", "vega", "iv", "unrealized_pnl", "stop_loss", "take_profit", "status", "opened_at", "updated_at" FROM `positions`;--> statement-breakpoint
DROP TABLE `positions`;--> statement-breakpoint
ALTER TABLE `__new_positions` RENAME TO `positions`;--> statement-breakpoint
CREATE TABLE `__new_risk_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`total_exposure` real DEFAULT 0,
	`net_delta` real DEFAULT 0,
	`net_gamma` real DEFAULT 0,
	`net_theta` real DEFAULT 0,
	`net_vega` real DEFAULT 0,
	`portfolio_heat` real DEFAULT 0,
	`max_drawdown` real DEFAULT 0,
	`daily_pnl` real DEFAULT 0,
	`sharpe_ratio` real,
	`sortino_ratio` real,
	`win_rate` real,
	`calculated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_risk_metrics`("id", "user_id", "total_exposure", "net_delta", "net_gamma", "net_theta", "net_vega", "portfolio_heat", "max_drawdown", "daily_pnl", "sharpe_ratio", "sortino_ratio", "win_rate", "calculated_at") SELECT "id", "user_id", "total_exposure", "net_delta", "net_gamma", "net_theta", "net_vega", "portfolio_heat", "max_drawdown", "daily_pnl", "sharpe_ratio", "sortino_ratio", "win_rate", "calculated_at" FROM `risk_metrics`;--> statement-breakpoint
DROP TABLE `risk_metrics`;--> statement-breakpoint
ALTER TABLE `__new_risk_metrics` RENAME TO `risk_metrics`;--> statement-breakpoint
CREATE TABLE `__new_strategies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`strategy_type` text,
	`description` text,
	`is_active` integer DEFAULT true,
	`config` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_strategies`("id", "user_id", "name", "strategy_type", "description", "is_active", "config", "created_at", "updated_at") SELECT "id", "user_id", "name", "strategy_type", "description", "is_active", "config", "created_at", "updated_at" FROM `strategies`;--> statement-breakpoint
DROP TABLE `strategies`;--> statement-breakpoint
ALTER TABLE `__new_strategies` RENAME TO `strategies`;--> statement-breakpoint
CREATE TABLE `__new_trades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`strategy_id` integer,
	`asset_id` integer,
	`position_id` integer,
	`trade_type` text NOT NULL,
	`position_type` text,
	`quantity` integer NOT NULL,
	`entry_price` real,
	`exit_price` real,
	`strike_price` real,
	`expiration_date` text,
	`realized_pnl` real DEFAULT 0,
	`commission` real DEFAULT 0,
	`slippage` real DEFAULT 0,
	`executed_at` text NOT NULL,
	`closed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_trades`("id", "user_id", "strategy_id", "asset_id", "position_id", "trade_type", "position_type", "quantity", "entry_price", "exit_price", "strike_price", "expiration_date", "realized_pnl", "commission", "slippage", "executed_at", "closed_at") SELECT "id", "user_id", "strategy_id", "asset_id", "position_id", "trade_type", "position_type", "quantity", "entry_price", "exit_price", "strike_price", "expiration_date", "realized_pnl", "commission", "slippage", "executed_at", "closed_at" FROM `trades`;--> statement-breakpoint
DROP TABLE `trades`;--> statement-breakpoint
ALTER TABLE `__new_trades` RENAME TO `trades`;--> statement-breakpoint
CREATE TABLE `__new_watchlist` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`asset_id` integer NOT NULL,
	`added_at` text NOT NULL,
	`notes` text,
	`ai_recommended` integer DEFAULT false,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_watchlist`("id", "user_id", "asset_id", "added_at", "notes", "ai_recommended") SELECT "id", "user_id", "asset_id", "added_at", "notes", "ai_recommended" FROM `watchlist`;--> statement-breakpoint
DROP TABLE `watchlist`;--> statement-breakpoint
ALTER TABLE `__new_watchlist` RENAME TO `watchlist`;--> statement-breakpoint
CREATE TABLE `__new_watchlist_recommendations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`asset_id` integer NOT NULL,
	`recommendation_reason` text NOT NULL,
	`confidence_score` real NOT NULL,
	`strategy_id` integer,
	`trade_action` text,
	`strike_price` real,
	`entry_price` real,
	`expiration_date` text,
	`potential_gain` real,
	`potential_gain_percentage` real,
	`potential_loss` real,
	`potential_loss_percentage` real,
	`risk_reward_ratio` real,
	`created_at` text NOT NULL,
	`dismissed` integer DEFAULT false,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_watchlist_recommendations`("id", "user_id", "asset_id", "recommendation_reason", "confidence_score", "strategy_id", "trade_action", "strike_price", "entry_price", "expiration_date", "potential_gain", "potential_gain_percentage", "potential_loss", "potential_loss_percentage", "risk_reward_ratio", "created_at", "dismissed") SELECT "id", "user_id", "asset_id", "recommendation_reason", "confidence_score", "strategy_id", "trade_action", "strike_price", "entry_price", "expiration_date", "potential_gain", "potential_gain_percentage", "potential_loss", "potential_loss_percentage", "risk_reward_ratio", "created_at", "dismissed" FROM `watchlist_recommendations`;--> statement-breakpoint
DROP TABLE `watchlist_recommendations`;--> statement-breakpoint
ALTER TABLE `__new_watchlist_recommendations` RENAME TO `watchlist_recommendations`;