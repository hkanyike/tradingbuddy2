CREATE TABLE `iv_surface_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`symbol` text NOT NULL,
	`snapshot_date` text NOT NULL,
	`expiration_date` text NOT NULL,
	`strike_price` real NOT NULL,
	`days_to_expiration` integer NOT NULL,
	`moneyness` real NOT NULL,
	`implied_volatility` real NOT NULL,
	`option_type` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_data_fetches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fetch_type` text NOT NULL,
	`symbols` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`records_fetched` integer DEFAULT 0,
	`error_message` text,
	`started_at` text NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `options_quotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`symbol` text NOT NULL,
	`option_symbol` text NOT NULL,
	`strike_price` real NOT NULL,
	`expiration_date` text NOT NULL,
	`option_type` text NOT NULL,
	`bid` real,
	`ask` real,
	`last_price` real,
	`volume` integer,
	`open_interest` integer,
	`implied_volatility` real,
	`delta` real,
	`gamma` real,
	`theta` real,
	`vega` real,
	`rho` real,
	`underlying_price` real,
	`timestamp` text NOT NULL,
	`created_at` text NOT NULL
);
