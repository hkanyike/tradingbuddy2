ALTER TABLE `watchlist_recommendations` ADD `trade_action` text;--> statement-breakpoint
ALTER TABLE `watchlist_recommendations` ADD `strike_price` real;--> statement-breakpoint
ALTER TABLE `watchlist_recommendations` ADD `entry_price` real;--> statement-breakpoint
ALTER TABLE `watchlist_recommendations` ADD `expiration_date` text;--> statement-breakpoint
ALTER TABLE `watchlist_recommendations` ADD `potential_gain` real;--> statement-breakpoint
ALTER TABLE `watchlist_recommendations` ADD `potential_gain_percentage` real;--> statement-breakpoint
ALTER TABLE `watchlist_recommendations` ADD `potential_loss` real;--> statement-breakpoint
ALTER TABLE `watchlist_recommendations` ADD `potential_loss_percentage` real;--> statement-breakpoint
ALTER TABLE `watchlist_recommendations` ADD `risk_reward_ratio` real;