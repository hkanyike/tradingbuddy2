CREATE TABLE `paper_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`paper_account_id` integer NOT NULL,
	`asset_id` integer NOT NULL,
	`order_type` text NOT NULL,
	`side` text NOT NULL,
	`quantity` integer NOT NULL,
	`limit_price` real,
	`stop_price` real,
	`status` text DEFAULT 'pending' NOT NULL,
	`filled_quantity` integer DEFAULT 0,
	`filled_price` real,
	`filled_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`paper_account_id`) REFERENCES `paper_trading_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `paper_positions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`paper_account_id` integer NOT NULL,
	`asset_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`average_cost` real NOT NULL,
	`current_price` real,
	`unrealized_pnl` real DEFAULT 0,
	`realized_pnl` real DEFAULT 0,
	`last_updated` text NOT NULL,
	FOREIGN KEY (`paper_account_id`) REFERENCES `paper_trading_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `paper_trading_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`cash_balance` real NOT NULL,
	`initial_balance` real NOT NULL,
	`total_equity` real NOT NULL,
	`total_pnl` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
