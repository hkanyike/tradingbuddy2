CREATE TABLE `alerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`position_id` integer,
	`alert_type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`severity` text DEFAULT 'info',
	`is_read` integer DEFAULT false,
	`is_dismissed` integer DEFAULT false,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `asset_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type_name` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `asset_types_type_name_unique` ON `asset_types` (`type_name`);--> statement-breakpoint
CREATE TABLE `assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`symbol` text NOT NULL,
	`name` text NOT NULL,
	`asset_type_id` integer,
	`sector` text,
	`liquidity_rank` integer,
	`is_active` integer DEFAULT true,
	`created_at` text NOT NULL,
	FOREIGN KEY (`asset_type_id`) REFERENCES `asset_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assets_symbol_unique` ON `assets` (`symbol`);--> statement-breakpoint
CREATE TABLE `broker_connections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`broker_name` text NOT NULL,
	`api_key_encrypted` text,
	`is_paper_trading` integer DEFAULT true,
	`is_connected` integer DEFAULT false,
	`last_connected_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `market_signals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`asset_id` integer,
	`signal_type` text NOT NULL,
	`strategy_type` text,
	`confidence_score` real,
	`recommended_action` text,
	`iv_premium` real,
	`skew` real,
	`term_structure` text,
	`liquidity_score` real,
	`risk_reward_ratio` real,
	`is_executed` integer DEFAULT false,
	`valid_until` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
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
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `risk_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
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
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`name` text NOT NULL,
	`strategy_type` text,
	`description` text,
	`is_active` integer DEFAULT true,
	`config` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
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
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`portfolio_balance` real DEFAULT 100000,
	`risk_tolerance` text DEFAULT 'moderate',
	`execution_mode` text DEFAULT 'manual',
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);