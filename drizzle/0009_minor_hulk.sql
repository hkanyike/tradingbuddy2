ALTER TABLE `user` ADD `portfolio_balance` real DEFAULT 100000;--> statement-breakpoint
ALTER TABLE `user` ADD `risk_tolerance` text DEFAULT 'moderate';--> statement-breakpoint
ALTER TABLE `user` ADD `execution_mode` text DEFAULT 'manual';